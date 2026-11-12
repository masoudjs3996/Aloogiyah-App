using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AlooGiyah_Shared.Exceptions;

namespace AlooGiyah_Application.Legal;

public static class MarketplaceTerms
{
    public const string CurrentVersion = "2026-11-10.1";
    public static (JsonElement Document, string Hash, string Snapshot) Get(string? version = null)
    {
        version ??= CurrentVersion;
        var assembly = typeof(MarketplaceTerms).Assembly;
        var resource = assembly.GetManifestResourceNames().SingleOrDefault(x => x.EndsWith($".marketplace-{version}.json", StringComparison.Ordinal));
        if (resource == null) throw new NotFoundException("نسخه قوانین یافت نشد.");
        using var stream = assembly.GetManifestResourceStream(resource)!;
        using var reader = new StreamReader(stream, Encoding.UTF8);
        var snapshot = reader.ReadToEnd().Replace("\r\n", "\n");
        return (JsonSerializer.Deserialize<JsonElement>(snapshot), Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(snapshot))), snapshot);
    }
    public static void Validate(bool accepted, string? version, string? hash)
    {
        if (!accepted) throw new BadRequestException("برای ارسال درخواست باید قوانین همکاری را مطالعه و تأیید کنید.");
        if (version != CurrentVersion || hash != Get().Hash)
            throw new ConflictException("نسخه قوانین تغییر کرده یا معتبر نیست؛ متن جدید را دریافت و دوباره تأیید کنید.");
    }
}
