using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Application.Services;

public static class ChatMediaPreview
{
    public static string? Validate(string? preview, string contentType)
    {
        if (string.IsNullOrEmpty(preview)) return null;
        const string prefix = "data:image/jpeg;base64,";
        if (preview.Length > 12000 || !preview.StartsWith(prefix, StringComparison.Ordinal) ||
            !(contentType.StartsWith("image/", StringComparison.Ordinal) || contentType.StartsWith("video/", StringComparison.Ordinal)))
            throw new BadRequestException("پیش‌نمایش رسانه معتبر نیست.");
        try {
            var bytes = Convert.FromBase64String(preview[prefix.Length..]);
            if (!IsThumbnail(bytes))
                throw new BadRequestException("پیش‌نمایش رسانه معتبر نیست.");
        } catch (FormatException) { throw new BadRequestException("پیش‌نمایش رسانه معتبر نیست."); }
        return preview;
    }
    private static bool IsThumbnail(byte[] data)
    {
        if (data.Length < 4 || data[0] != 255 || data[1] != 216) return false;
        int offset = 2;
        while (offset + 1 < data.Length) {
            if (data[offset++] != 255) return false;
            while (offset < data.Length && data[offset] == 255) offset++;
            if (offset >= data.Length) return false;
            var marker = data[offset++];
            if (marker is 0xd9 or 0xda) return false;
            if (marker == 0x01 || marker is >= 0xd0 and <= 0xd7) continue;
            if (offset + 2 > data.Length) return false;
            int length = (data[offset] << 8) | data[offset + 1];
            if (length < 2 || offset + length > data.Length) return false;
            if (marker is 0xc0 or 0xc1 or 0xc2 or 0xc3 or 0xc5 or 0xc6 or 0xc7 or 0xc9 or 0xca or 0xcb or 0xcd or 0xce or 0xcf) {
                if (length < 8) return false;
                int height = (data[offset + 3] << 8) | data[offset + 4];
                int width = (data[offset + 5] << 8) | data[offset + 6];
                return width is > 0 and <= 64 && height is > 0 and <= 64;
            }
            offset += length;
        }
        return false;
    }
}
