
namespace AlooGiyah_Application.DTOs.Address;

public class AddressDto
{
    public string Code { get; set; } = string.Empty;
    public string UserCode { get; set; } = string.Empty;

    public string Street { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool IsDefault { get; set; }

    public string ProvinceCode { get; set; } = string.Empty;
    public string ProvinceName { get; set; } = string.Empty;

    public string CountyCode { get; set; } = string.Empty;
    public string CountyName { get; set; } = string.Empty;

    public string? CityCode { get; set; }
    public string? CityName { get; set; }

    public string? VillageCode { get; set; }
    public string? VillageName { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}