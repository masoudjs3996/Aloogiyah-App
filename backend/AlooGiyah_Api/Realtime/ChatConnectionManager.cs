using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace AlooGiyah_Api.Realtime;

public sealed class ChatConnectionManager
{
    private sealed class Connection(WebSocket socket)
    {
        public WebSocket Socket { get; } = socket;
        public SemaphoreSlim SendLock { get; } = new(1, 1);
        public ConcurrentDictionary<string, string> Rooms { get; } = new(StringComparer.Ordinal);
    }

    private readonly ConcurrentDictionary<string, ConcurrentDictionary<Guid, Connection>> _connections = new();
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task RunAsync(
        string userCode,
        WebSocket socket,
        Func<string, CancellationToken, Task<string?>> resolveRoomPeer,
        CancellationToken cancellationToken)
    {
        var connectionId = Guid.NewGuid();
        var userConnections = _connections.GetOrAdd(userCode, _ => new());
        var connection = new Connection(socket);
        userConnections[connectionId] = connection;
        await NotifyRoomWatchersAsync(userCode, true, cancellationToken);
        var buffer = new byte[4096];
        try
        {
            while (socket.State == WebSocketState.Open && !cancellationToken.IsCancellationRequested)
            {
                using var frame = new MemoryStream();
                WebSocketReceiveResult result;
                var oversizedFrame = false;
                do
                {
                    result = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), cancellationToken);
                    if (result.MessageType == WebSocketMessageType.Close) break;
                    if (result.MessageType == WebSocketMessageType.Text && !oversizedFrame && frame.Length + result.Count <= 2048)
                        frame.Write(buffer, 0, result.Count);
                    else if (result.MessageType == WebSocketMessageType.Text)
                        oversizedFrame = true;
                } while (!result.EndOfMessage);
                if (result.MessageType == WebSocketMessageType.Close) break;
                if (result.MessageType != WebSocketMessageType.Text || oversizedFrame) continue;
                await HandleClientEventAsync(userCode, connection, frame.ToArray(), resolveRoomPeer, cancellationToken);
            }
        }
        catch (OperationCanceledException) { }
        catch (WebSocketException) { }
        finally
        {
            userConnections.TryRemove(connectionId, out _);
            var isLastConnection = userConnections.IsEmpty;
            if (isLastConnection) _connections.TryRemove(userCode, out _);
            if (isLastConnection)
            {
                await NotifyRoomWatchersAsync(userCode, false, CancellationToken.None);
                foreach (var (roomCode, peerCode) in connection.Rooms)
                    await PublishPresenceAsync(peerCode, roomCode, userCode, false, CancellationToken.None);
            }
            if (socket.State is WebSocketState.Open or WebSocketState.CloseReceived)
                await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Connection closed", CancellationToken.None);
        }
    }

    public async Task PublishMessageAsync(string userCode, object message, CancellationToken cancellationToken)
    {
        if (!_connections.TryGetValue(userCode, out var userConnections)) return;
        var payload = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { type = "message.received", data = message }, JsonOptions));
        foreach (var connection in userConnections.Values)
        {
            var socket = connection.Socket;
            if (socket.State != WebSocketState.Open) continue;
            await SendAsync(connection, payload, cancellationToken);
        }
    }

    public async Task PublishConversationAsync(string userCode, object conversation, CancellationToken cancellationToken)
    {
        if (!_connections.TryGetValue(userCode, out var userConnections)) return;
        var payload = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { type = "conversation.created", data = conversation }, JsonOptions));
        foreach (var connection in userConnections.Values)
            await SendAsync(connection, payload, cancellationToken);
    }

    private async Task HandleClientEventAsync(
        string userCode,
        Connection connection,
        byte[] frame,
        Func<string, CancellationToken, Task<string?>> resolveRoomPeer,
        CancellationToken cancellationToken)
    {
        try
        {
            using var document = JsonDocument.Parse(frame);
            var root = document.RootElement;
            if (!root.TryGetProperty("type", out var typeElement) || typeElement.ValueKind != JsonValueKind.String ||
                !root.TryGetProperty("conversationCode", out var roomElement) || roomElement.ValueKind != JsonValueKind.String)
                return;
            var type = typeElement.GetString();
            var roomCode = roomElement.GetString();
            if (string.IsNullOrWhiteSpace(type) || string.IsNullOrWhiteSpace(roomCode)) return;

            if (type == "presence.subscribe")
            {
                var peerCode = await resolveRoomPeer(roomCode, cancellationToken);
                if (string.IsNullOrWhiteSpace(peerCode)) return;
                var firstConnection = !HasRoomConnection(userCode, roomCode);
                connection.Rooms[roomCode] = peerCode;
                await SendPresenceAsync(connection, roomCode, peerCode, IsUserOnline(peerCode), cancellationToken);
                if (firstConnection)
                    await PublishPresenceAsync(peerCode, roomCode, userCode, true, cancellationToken);
            }
            else if (type == "presence.unsubscribe") connection.Rooms.TryRemove(roomCode, out _);
        }
        catch (JsonException)
        {
            // Keep malformed client data from terminating the message connection.
        }
    }

    private bool HasRoomConnection(string userCode, string roomCode) =>
        _connections.TryGetValue(userCode, out var connections) &&
        connections.Values.Any(connection => connection.Socket.State == WebSocketState.Open && connection.Rooms.ContainsKey(roomCode));

    public bool IsUserOnline(string userCode) =>
        _connections.TryGetValue(userCode, out var connections) &&
        connections.Values.Any(connection => connection.Socket.State == WebSocketState.Open);

    private async Task NotifyRoomWatchersAsync(string userCode, bool isOnline, CancellationToken cancellationToken)
    {
        foreach (var (watcherCode, connections) in _connections)
        {
            foreach (var connection in connections.Values)
            {
                foreach (var (roomCode, peerCode) in connection.Rooms)
                {
                    if (peerCode == userCode)
                        await SendPresenceAsync(connection, roomCode, userCode, isOnline, cancellationToken);
                }
            }
        }
    }

    private async Task PublishPresenceAsync(string targetUserCode, string roomCode, string userCode, bool isOnline, CancellationToken cancellationToken)
    {
        if (!_connections.TryGetValue(targetUserCode, out var connections)) return;
        var payload = PresencePayload(roomCode, userCode, isOnline);
        foreach (var connection in connections.Values.Where(item => item.Rooms.ContainsKey(roomCode)))
            await SendAsync(connection, payload, cancellationToken);
    }

    private static Task SendPresenceAsync(Connection connection, string roomCode, string userCode, bool isOnline, CancellationToken cancellationToken) =>
        SendAsync(connection, PresencePayload(roomCode, userCode, isOnline), cancellationToken);

    private static byte[] PresencePayload(string roomCode, string userCode, bool isOnline) =>
        Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new
        {
            type = "presence.changed",
            data = new { conversationCode = roomCode, userCode, isOnline }
        }, JsonOptions));

    private static async Task SendAsync(Connection connection, byte[] payload, CancellationToken cancellationToken)
    {
        try
        {
            await connection.SendLock.WaitAsync(cancellationToken);
            try
            {
                if (connection.Socket.State == WebSocketState.Open)
                    await connection.Socket.SendAsync(payload, WebSocketMessageType.Text, true, cancellationToken);
            }
            finally { connection.SendLock.Release(); }
        }
        catch (WebSocketException) { }
        catch (ObjectDisposedException) { }
        catch (OperationCanceledException) { }
    }
}
