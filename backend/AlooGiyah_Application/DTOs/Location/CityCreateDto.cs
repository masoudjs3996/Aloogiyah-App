
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Location;

public class CityCreateDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string CountyCode { get; set; } = string.Empty;

    public string StatusCode { get; set; } = string.Empty;
}