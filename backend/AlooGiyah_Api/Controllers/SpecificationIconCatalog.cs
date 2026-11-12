using System.Text.Json;

namespace AlooGiyah_Api.Controllers;

internal static class SpecificationIconCatalog
{
    private static readonly Dictionary<string, IconEntry> Entries = Load();

    public static IEnumerable<IconEntry> All => Entries.Values;

    public static IconEntry? Find(string id) => Entries.GetValueOrDefault(id);

    private static Dictionary<string, IconEntry> Load()
    {
        using var stream = typeof(SpecificationIconCatalog).Assembly.GetManifestResourceStream("specification-icons.json")
            ?? throw new InvalidOperationException("Specification icon assets are missing.");
        var catalog = JsonSerializer.Deserialize<IconAsset>(stream, new JsonSerializerOptions(JsonSerializerDefaults.Web))
            ?? throw new InvalidOperationException("Specification icon assets are invalid.");
        return catalog.Icons.ToDictionary(icon => icon.Id, StringComparer.Ordinal);
    }

    private sealed record IconAsset(IconEntry[] Icons);
    internal sealed record IconEntry(string Id, string Label, byte[] Png);
}
