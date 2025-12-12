
using Microsoft.AspNetCore.Http;

namespace AlooGiyah_Application.DTOs.Farm;

public class UploadFarmImageDto
{
    public required string Code { get; set; }
    public required IFormFile File { get; set; }
}
