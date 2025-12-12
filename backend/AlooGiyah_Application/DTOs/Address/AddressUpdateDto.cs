
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Address;

public class AddressUpdateDto
{
    [Required]
    public string AddressCode { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string Street { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string PostalCode { get; set; } = string.Empty;

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool IsDefault { get; set; }

    [Required]
    public string ProvinceCode { get; set; } = string.Empty;

    [Required]
    public string CountyCode { get; set; } = string.Empty;

    public string? CityCode { get; set; }
    public string? VillageCode { get; set; }
}