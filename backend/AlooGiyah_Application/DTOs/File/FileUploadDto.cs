using Microsoft.AspNetCore.Http;
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.File
{
    public class FileUploadDto
    {
        public IFormFile File { get; set; } = null!;
        public string FileTypeCode { get; set; } = string.Empty;
        public string? Description { get; set; }
        public EntityFile EntityFile { get; set; }
        public string? EntityCode { get; set; } = string.Empty;
        public bool IsPrimary { get; set; } = false;
    }
}
