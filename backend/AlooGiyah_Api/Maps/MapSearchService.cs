using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Npgsql;
using System.Diagnostics.Metrics;

namespace AlooGiyah_Api.Maps;

public record MapPlace(string Name, double Latitude, double Longitude, double[] Bounds);
public record MapSettings(string TileUrl, string Attribution, int MaxZoom, bool SearchEnabled);

public class MapSearchService(IConfiguration config, IHttpClientFactory clients)
{
    private static readonly Meter Metrics = new("Aloogiyah.Maps");
    private static readonly Counter<long> CacheHits = Metrics.CreateCounter<long>("map.search.cache_hits");
    private static readonly Counter<long> UpstreamRequests = Metrics.CreateCounter<long>("map.search.upstream_requests");
    private static readonly Counter<long> UpstreamErrors = Metrics.CreateCounter<long>("map.search.upstream_errors");
    private static readonly Histogram<double> QueueSeconds = Metrics.CreateHistogram<double>("map.search.queue_seconds");
    private string Setting(string name, string fallback) => string.IsNullOrWhiteSpace(config[name]) ? fallback : config[name]!;
    public MapSettings Settings
    {
        get
        {
            var tileUrl = Setting("Maps:TileUrl", "https://tile.openstreetmap.org/{z}/{x}/{y}.png");
            var sample = tileUrl.Replace("{s}", "a").Replace("{z}", "0").Replace("{x}", "0").Replace("{y}", "0");
            if (!Uri.TryCreate(sample, UriKind.Absolute, out var tileUri) || tileUri.Scheme != "https")
                throw new InvalidOperationException("نشانی تصاویر نقشه باید HTTPS باشد.");
            return new(tileUrl,
                Setting("Maps:Attribution", "&copy; <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\" rel=\"noopener noreferrer\">OpenStreetMap</a> contributors"),
                Math.Clamp(config.GetValue("Maps:MaxZoom", 19), 1, 19),
                config.GetValue("Maps:SearchEnabled", true));
        }
    }

    public static string Normalize(string query)
    {
        var value = query.Replace('ي', 'ی').Replace('ك', 'ک').Replace('\u200c', ' ');
        value = Regex.Replace(value, "[۰-۹٠-٩]", m =>
            ((m.Value[0] >= '۰' ? m.Value[0] - '۰' : m.Value[0] - '٠')).ToString(CultureInfo.InvariantCulture));
        return Regex.Replace(value.Trim(), @"\s+", " ");
    }

    public async Task<IReadOnlyList<MapPlace>> SearchAsync(string query, CancellationToken cancellationToken)
    {
        if (!Settings.SearchEnabled) throw new InvalidOperationException("جست‌وجوی نقشه فعلاً غیرفعال است؛ روی نقشه انتخاب کنید.");
        query = Normalize(query);
        if (query.Length is < 3 or > 160) throw new ArgumentException("نام شهر، محله یا خیابان را بین ۳ تا ۱۶۰ نویسه وارد کنید.");
        var endpoint = Setting("Maps:SearchUrl", "https://nominatim.openstreetmap.org/search");
        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var uri) || uri.Scheme != "https")
            throw new InvalidOperationException("نشانی سرویس جست‌وجوی نقشه باید HTTPS باشد.");
        var key = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(endpoint + "|fa|ir|" + query)));
        await using var connection = new NpgsqlConnection(config.GetConnectionString("DefaultConnection"));
        await connection.OpenAsync(cancellationToken);
        var cached = await Cached(connection, key, cancellationToken);
        if (cached != null) { CacheHits.Add(1); return cached; }

        // The database lock serializes outbound requests across ALL API processes and hosts.
        var queuedAt = DateTime.UtcNow;
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await using (var gate = new NpgsqlCommand("SELECT pg_advisory_xact_lock(184638217)", connection, transaction))
            await gate.ExecuteNonQueryAsync(cancellationToken);
        cached = await Cached(connection, key, cancellationToken);
        if (cached != null) { CacheHits.Add(1); await transaction.CommitAsync(cancellationToken); return cached; }
        await using (var read = new NpgsqlCommand("""SELECT GREATEST("NextAllowedAt"-clock_timestamp(), interval '0') FROM "MapSearchGate" WHERE "Id"=1""", connection, transaction))
        {
            var wait = (TimeSpan)(await read.ExecuteScalarAsync(cancellationToken))!;
            if (wait > TimeSpan.Zero) await Task.Delay(wait, cancellationToken);
        }
        cancellationToken.ThrowIfCancellationRequested();

        IReadOnlyList<MapPlace>? places = null;
        Exception? failure = null;
        var cooldown = TimeSpan.FromMilliseconds(1100);
        try
        {
            using var client = clients.CreateClient("map-search");
            using var request = new HttpRequestMessage(HttpMethod.Get,
                endpoint + (endpoint.Contains('?') ? "&" : "?") + "format=jsonv2&countrycodes=ir&limit=5&accept-language=fa&q=" + Uri.EscapeDataString(query));
            request.Headers.UserAgent.ParseAdd(Setting("Maps:UserAgent", "Aloogiyah-App/1.0"));
            request.Headers.Accept.ParseAdd("application/json");
            // Once sent, finish and persist the gate even if the user closes the map.
            QueueSeconds.Record((DateTime.UtcNow - queuedAt).TotalSeconds);
            UpstreamRequests.Add(1);
            using var response = await client.SendAsync(request, CancellationToken.None);
            if ((int)response.StatusCode == 429)
                cooldown = TimeSpan.FromSeconds(Math.Max(60, Math.Min(3600, response.Headers.RetryAfter?.Delta?.TotalSeconds ?? 60)));
            if ((int)response.StatusCode == 403) cooldown = TimeSpan.FromMinutes(30);
            response.EnsureSuccessStatusCode();
            using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            places = Parse(json.RootElement);
        }
        catch (Exception error) { UpstreamErrors.Add(1); failure = error; }

        // Leave a full 1.1s gap after responses, including errors (no retry loops).
        await using (var update = new NpgsqlCommand("""UPDATE "MapSearchGate" SET "NextAllowedAt"=clock_timestamp()+@cooldown WHERE "Id"=1""", connection, transaction))
        {
            update.Parameters.AddWithValue("cooldown", cooldown);
            await update.ExecuteNonQueryAsync(CancellationToken.None);
        }
        if (places != null)
        {
            await using var save = new NpgsqlCommand("""
                INSERT INTO "MapSearchCache" ("Key","Payload","ExpiresAt") VALUES (@key,@payload,now()+interval '7 days')
                ON CONFLICT ("Key") DO UPDATE SET "Payload"=EXCLUDED."Payload","ExpiresAt"=EXCLUDED."ExpiresAt";
                DELETE FROM "MapSearchCache" WHERE "ExpiresAt"<now();
                """, connection, transaction);
            save.Parameters.AddWithValue("key", key);
            save.Parameters.AddWithValue("payload", JsonSerializer.Serialize(places));
            await save.ExecuteNonQueryAsync(CancellationToken.None);
        }
        await transaction.CommitAsync(CancellationToken.None);
        if (failure != null) throw new HttpRequestException("جست‌وجوی نقشه در دسترس نیست؛ موقعیت را روی نقشه انتخاب کنید.", failure);
        return places!;
    }

    private static async Task<IReadOnlyList<MapPlace>?> Cached(NpgsqlConnection connection, string key, CancellationToken token)
    {
        await using var command = new NpgsqlCommand("""SELECT "Payload" FROM "MapSearchCache" WHERE "Key"=@key AND "ExpiresAt">now()""", connection);
        command.Parameters.AddWithValue("key", key);
        var payload = await command.ExecuteScalarAsync(token) as string;
        return payload == null ? null : JsonSerializer.Deserialize<List<MapPlace>>(payload);
    }

    public static IReadOnlyList<MapPlace> Parse(JsonElement data)
    {
        var result = new List<MapPlace>();
        foreach (var item in data.EnumerateArray().Take(5))
        {
            if (!item.TryGetProperty("display_name", out var name) ||
                !item.TryGetProperty("lat", out var lat) || !item.TryGetProperty("lon", out var lon) ||
                !item.TryGetProperty("boundingbox", out var box)) continue;
            if (!double.TryParse(lat.GetString(), CultureInfo.InvariantCulture, out var latitude) ||
                !double.TryParse(lon.GetString(), CultureInfo.InvariantCulture, out var longitude)) continue;
            var bounds = box.EnumerateArray().Select(x => double.Parse(x.GetString()!, CultureInfo.InvariantCulture)).ToArray();
            if (bounds.Length != 4 || !bounds.All(double.IsFinite) || !double.IsFinite(latitude) || !double.IsFinite(longitude) ||
                latitude is < 24.5 or > 40 || longitude is < 44 or > 63.5 ||
                bounds[0] > bounds[1] || bounds[2] > bounds[3]) continue;
            result.Add(new(name.GetString() ?? "", latitude, longitude, bounds));
        }
        return result;
    }
}
