
using AlooGiyah_Application.DTOs.BaseDto;
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.File;

public class FileFilterDto : BaseFilterDto
{
    public string? UserCode { get; set; }
    public string? FileTypeCode { get; set; }
    public EntityFile? EntityFile { get; set; }
    public string? EntityCode { get; set; }
    public string? SearchText { get; set; }
}
