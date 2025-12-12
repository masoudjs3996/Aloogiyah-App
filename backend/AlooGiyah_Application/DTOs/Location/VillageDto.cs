namespace AlooGiyah_Application.DTOs.Location;

public class VillageDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CountyCode { get; set; } = string.Empty;
    public string CountyName { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string StatusCode { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
}