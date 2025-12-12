
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.AgriculturalProduct;

public class SetPrimaryProductImageDto
{
    [Required]
    public string FileCode { get; set; } = string.Empty;
}
