
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Location;

public class ProvinceCreateDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public string StatusCode { get; set; } = string.Empty;
}
