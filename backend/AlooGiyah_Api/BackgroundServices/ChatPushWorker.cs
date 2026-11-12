using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Channels;
using AlooGiyah_Application.DTOs.ChatMessage;
using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Api.BackgroundServices;

public sealed class ChatPushQueue(ILogger<ChatPushQueue> logger)
{
    internal readonly Channel<string> Messages = Channel.CreateBounded<string>(new BoundedChannelOptions(1024) { FullMode = BoundedChannelFullMode.Wait, SingleReader = true });
    public void Enqueue(ChatMessageDto message)
    {
        if (!Messages.Writer.TryWrite(message.Code)) logger.LogWarning("Chat push queue full; message remains available in chat history.");
    }
}

public sealed class ChatPushWorker(ChatPushQueue queue, IServiceScopeFactory scopes, IHttpClientFactory clients, IConfiguration config, ILogger<ChatPushWorker> logger) : BackgroundService
{
    private readonly Dictionary<string, (string Token, DateTimeOffset Created, DateTimeOffset Due)> receipts = new();
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (queue.Messages.Reader.TryRead(out var code))
                {
                    if (config.GetValue<bool>("Push:Enabled")) await SendAsync(code, stoppingToken);
                }
                else
                {
                    using var wake = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                    wake.CancelAfter(TimeSpan.FromSeconds(30));
                    try { await queue.Messages.Reader.WaitToReadAsync(wake.Token); }
                    catch (OperationCanceledException) when (!stoppingToken.IsCancellationRequested) { }
                }
                if (config.GetValue<bool>("Push:Enabled")) await CheckReceiptsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception error) { logger.LogWarning("Chat push delivery failed ({ErrorType}); saved messages are unaffected.", error.GetType().Name); }
        }
    }
    private HttpClient Client()
    {
        var client = clients.CreateClient("expo-push");
        var access = config["Push:ExpoAccessToken"];
        if (!string.IsNullOrWhiteSpace(access)) client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", access);
        return client;
    }
    private async Task SendAsync(string code, CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AlooGiyahDbContext>();
        var message = await db.ChatMessages.AsNoTracking().Where(x => x.Code == code && !x.IsDeleted && !x.IsRead &&
                !db.ChatConversationBlocks.Any(block => block.ConversationId == x.ConversationId && !block.IsDeleted))
            .Select(x => new { x.ReceiverId, Room = x.Conversation!.Code }).SingleOrDefaultAsync(ct);
        if (message == null) return;
        var receiver = await db.Users.AsNoTracking().Where(x => x.UserId == message.ReceiverId && !x.IsDeleted && x.ReceiveGeneralNotifications).Select(x => x.Code).SingleOrDefaultAsync(ct);
        if (receiver == null) return;
        var tokens = await db.PushRegistrations.Where(x => x.UserId == message.ReceiverId && x.ExpiresAt > DateTimeOffset.UtcNow)
            .OrderByDescending(x => x.UpdatedAt).Select(x => x.Token).Take(20).ToListAsync(ct);
        if (tokens.Count == 0) return;
        // Message text stays in the authenticated chat API, not on third-party push infrastructure or the lock screen.
        using var client = Client();
        using var response = await client.PostAsJsonAsync("https://exp.host/--/api/v2/push/send", tokens.Select(token => new {
            to = token, title = "پیام جدید در الو گیاه", body = "برای دیدن فرستنده و متن پیام، گفتگو را باز کنید.", sound = "default", channelId = "chat", categoryId = "chat",
            data = new { type = "chat", messageCode = code, conversationCode = message.Room, receiverCode = receiver }
        }), ct);
        response.EnsureSuccessStatusCode();
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
        if (!json.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array) return;
        var index = 0;
        foreach (var ticket in data.EnumerateArray())
        {
            if (index >= tokens.Count) break;
            var token = tokens[index++];
            if (ticket.TryGetProperty("id", out var id) && receipts.Count < 10000)
                receipts[id.GetString()!] = (token, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddMinutes(15));
            if (IsUnregistered(ticket)) await db.PushRegistrations.Where(x => x.Token == token && x.UserId == message.ReceiverId).ExecuteDeleteAsync(ct);
            else if (ticket.TryGetProperty("status", out var status) && status.GetString() == "error")
                logger.LogWarning("Expo rejected a chat push ticket; check the FCM/APNs credentials and Expo push access configuration.");
        }
    }
    private static bool IsUnregistered(JsonElement value) => value.TryGetProperty("details", out var details) && details.TryGetProperty("error", out var error) && error.GetString() == "DeviceNotRegistered";
    private async Task CheckReceiptsAsync(CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var key in receipts.Where(x => now - x.Value.Created > TimeSpan.FromHours(24)).Select(x => x.Key).ToList()) receipts.Remove(key);
        var due = receipts.Where(x => x.Value.Due <= now).Take(300).ToList();
        if (due.Count == 0) return;
        foreach (var entry in due) receipts[entry.Key] = (entry.Value.Token, entry.Value.Created, now.AddMinutes(5));
        using var client = Client();
        using var response = await client.PostAsJsonAsync("https://exp.host/--/api/v2/push/getReceipts", new { ids = due.Select(x => x.Key) }, ct);
        response.EnsureSuccessStatusCode();
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
        if (!json.RootElement.TryGetProperty("data", out var data)) return;
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AlooGiyahDbContext>();
        foreach (var entry in due)
            if (data.TryGetProperty(entry.Key, out var receipt))
            {
                if (IsUnregistered(receipt)) await db.PushRegistrations.Where(x => x.Token == entry.Value.Token && x.UpdatedAt <= entry.Value.Created).ExecuteDeleteAsync(ct);
                receipts.Remove(entry.Key);
            }
    }
}
