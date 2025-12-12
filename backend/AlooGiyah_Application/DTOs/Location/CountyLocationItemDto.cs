
namespace AlooGiyah_Application.DTOs.Location;

public class CountyLocationItemDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string StatusCode { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
}
