using AlooGiyah_Domain.Enums;
namespace AlooGiyah_Application.DTOs.File;

public class FileDto
{
    public string FileCode { get; set; } = string.Empty;
    public string FileTypeCode { get; set; } = string.Empty;
    public string UserCode { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EntityFile EntityFile { get; set; }
    public string? EntityCode { get; set; }
    public bool IsPrimary { get; set; } = false;
    public DateTimeOffset CreatedAt { get; set; }

}
