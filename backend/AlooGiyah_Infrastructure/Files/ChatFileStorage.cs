using System.IO.Compression;
using System.Buffers.Binary;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.ValueObjects;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace AlooGiyah_Infrastructure.Files;
public class ChatFileStorage : IChatFileStorage
{
    public const long MaxSize = 10 * 1024 * 1024;
    public const long MaxVideoSize = 50 * 1024 * 1024;
    protected virtual bool AllowVideo => true;
    private readonly string root;
    public ChatFileStorage(IConfiguration config) : this(config, "ChatFiles", "ChatPath") { }
    protected ChatFileStorage(IConfiguration config, string folder, string setting)
    {
        // A sibling of public uploads: chat files are served only by the authorized endpoint.
        var uploads = config["FileStorage:UploadPath"] ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "AlooGiyah", "Uploads");
        root = config["FileStorage:" + setting] ?? Path.Combine(Path.GetDirectoryName(Path.GetFullPath(uploads).TrimEnd(Path.DirectorySeparatorChar))!, folder);
        var publicRoot = Path.GetFullPath(uploads).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        var privateRoot = Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        if (privateRoot.StartsWith(publicRoot, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("ChatPath must be outside public uploads.");
    }
    public async Task<ChatStoredFile> SaveAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var video = ext is ".mp4" or ".mov" or ".webm";
        var limit = video && AllowVideo ? MaxVideoSize : MaxSize;
        var sizeError = video && AllowVideo ? "حداکثر حجم ویدئو ۵۰ مگابایت است." : "حداکثر حجم فایل ۱۰ مگابایت است.";
        if (file.Length <= 0 || file.Length > limit) throw new BadRequestException(sizeError);
        var type = ext switch {
            ".jpg" or ".jpeg" => "image/jpeg", ".png" => "image/png", ".webp" => "image/webp",
            ".mp4" when AllowVideo => "video/mp4", ".mov" when AllowVideo => "video/quicktime", ".webm" when AllowVideo => "video/webm",
            ".pdf" => "application/pdf", ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", _ => null };
        if (type == null) throw new BadRequestException(AllowVideo ? "فقط تصویر، MP4، MOV، WEBM، PDF، DOCX و XLSX مجاز هستند." : "فقط JPG، PNG، WEBP، PDF، DOCX و XLSX مجاز هستند.");
        using var bytes = new MemoryStream();
        using (var input = file.OpenReadStream()) {
            var buffer = new byte[81920]; int count;
            while ((count = await input.ReadAsync(buffer.AsMemory(), cancellationToken)) > 0) {
                if (bytes.Length + count > limit) throw new BadRequestException(sizeError);
                await bytes.WriteAsync(buffer.AsMemory(0, count), cancellationToken);
            }
        }
        var data = bytes.ToArray();
        bool Has(params byte[] prefix) => data.AsSpan().StartsWith(prefix);
        var valid = ext switch {
            ".jpg" or ".jpeg" => Has(255,216,255), ".png" => Has(137,80,78,71,13,10,26,10),
            ".pdf" => Has(37,80,68,70,45),
            ".webp" => data.Length >= 12 && Has(82,73,70,70) && data.AsSpan(8,4).SequenceEqual("WEBP"u8),
            ".mp4" or ".mov" => ValidIsoVideo(data, ext),
            ".webm" => Has(0x1a, 0x45, 0xdf, 0xa3) && data.AsSpan(0, Math.Min(data.Length, 4096)).IndexOf(new byte[] { 0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d }) >= 0,
            ".docx" or ".xlsx" => ValidOffice(bytes, ext), _ => false };
        if (!valid) throw new BadRequestException("محتوای فایل با نوع مجاز آن مطابقت ندارد.");
        var key = DateTime.UtcNow.ToString("yyyy-MM-dd") + "/" + Guid.NewGuid().ToString("N") + ext;
        var path = Resolve(key); Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        try { await File.WriteAllBytesAsync(path, data, cancellationToken); }
        catch { File.Delete(path); throw; }
        var name = Path.GetFileName(file.FileName.Replace('\\','/'));
        name = new string(name.Where(c => !char.IsControl(c)).ToArray());
        if (name.Length > 255) name = name[..240] + ext;
        return new(key, name, type, data.LongLength);
    }
    private static bool ValidIsoVideo(byte[] data, string ext)
    {
        // Check the ISO container and its video brand; HEIC/AVIF are not MP4 videos.
        bool brand = false, media = false;
        for (int offset = 0; offset <= data.Length - 8;)
        {
            long size = BinaryPrimitives.ReadUInt32BigEndian(data.AsSpan(offset, 4));
            var kind = data.AsSpan(offset + 4, 4);
            int header = 8;
            if (size == 1) {
                if (data.Length - offset < 16) return false;
                var wide = BinaryPrimitives.ReadUInt64BigEndian(data.AsSpan(offset + 8, 8));
                if (wide > (ulong)(data.Length - offset)) return false;
                size = (long)wide; header = 16;
            }
            if (size == 0) size = data.Length - offset;
            if (size < header || size > data.Length - offset) return false;
            if (kind.SequenceEqual("ftyp"u8)) {
                if (size < header + 8) return false;
                for (int i = offset + header; i <= offset + size - 4; i += 4) {
                    if (i == offset + header + 4) continue; // minor version
                    var b = data.AsSpan(i, 4);
                    if (ext == ".mov" ? b.SequenceEqual("qt  "u8) :
                        b.SequenceEqual("isom"u8) || b.SequenceEqual("iso2"u8) || b.SequenceEqual("mp41"u8) || b.SequenceEqual("mp42"u8) || b.SequenceEqual("avc1"u8) || b.SequenceEqual("M4V "u8)) brand = true;
                }
            }
            if ((kind.SequenceEqual("mdat"u8) || kind.SequenceEqual("moov"u8)) && size > header) media = true;
            offset += (int)size;
        }
        return brand && media;
    }
    private static bool ValidOffice(MemoryStream bytes, string ext)
    {
        try {
            bytes.Position = 0;
            using var zip = new ZipArchive(bytes, ZipArchiveMode.Read, true);
            if (zip.Entries.Count > 2000 || zip.Entries.Sum(e => e.Length) > 100 * 1024 * 1024) return false;
            if (zip.Entries.Any(e => e.FullName.EndsWith("vbaProject.bin", StringComparison.OrdinalIgnoreCase))) return false;
            return zip.GetEntry("[Content_Types].xml") != null && zip.GetEntry(ext == ".docx" ? "word/document.xml" : "xl/workbook.xml") != null;
        } catch (InvalidDataException) { return false; }
    }
    private string Resolve(string key)
    {
        if (!System.Text.RegularExpressions.Regex.IsMatch(key, @"^\d{4}-\d{2}-\d{2}/[a-f0-9]{32}\.(jpg|jpeg|png|webp|pdf|docx|xlsx|mp4|mov|webm)$")) throw new NotFoundException("فایل پیدا نشد.");
        return Path.Combine(root, key.Replace('/', Path.DirectorySeparatorChar));
    }
    public Stream Open(string key) {
        var path = Resolve(key);
        if (!File.Exists(path)) throw new NotFoundException("فایل پیدا نشد.");
        return File.OpenRead(path);
    }
    public void Delete(string key) => File.Delete(Resolve(key));
}
