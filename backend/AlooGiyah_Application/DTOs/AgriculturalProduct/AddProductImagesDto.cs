
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.AgriculturalProduct;

public class AddProductImagesDto
{
    [Required]
    public string ProductCode { get; set; } = string.Empty;

    [Required]
    public List<IFormFile> Files { get; set; } = new();
}
