
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Location;

public class CountyCreateDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string ProvinceCode { get; set; } = string.Empty;

    public string StatusCode { get; set; } = "EA54D94863";
}