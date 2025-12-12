using System.ComponentModel.DataAnnotations;

public class VillageCreateDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string CountyCode { get; set; } = string.Empty;

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string StatusCode { get; set; } = string.Empty;
}