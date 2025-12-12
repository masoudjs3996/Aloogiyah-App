using Microsoft.AspNetCore.Http;


namespace AlooGiyah_Application.DTOs.Category;

public class UploadCategoryImageDto
{
    public required string Code { get; set; }
    public required IFormFile File { get; set; }
}