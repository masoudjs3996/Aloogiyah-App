namespace AlooGiyah_Application.Commons;

public sealed class AssignmentLocation
{
    public string Code { get; set; } = "";
    public int ProvinceId { get; set; }
    public int CountyId { get; set; }
    public int? CityId { get; set; }
    public int? VillageId { get; set; }
    public string Province { get; set; } = "";
    public string County { get; set; } = "";
    public string? City { get; set; }
    public string? Village { get; set; }
    public string Street { get; set; } = "";
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool IsDefault { get; set; }

    public bool HasCoordinates => Latitude is >= -90 and <= 90 && Longitude is >= -180 and <= 180;

    public double? DistanceTo(AssignmentLocation? other)
    {
        if (!HasCoordinates || other?.HasCoordinates != true) return null;
        const double radians = Math.PI / 180;
        var lat1 = Latitude!.Value * radians;
        var lat2 = other.Latitude!.Value * radians;
        var dlat = lat2 - lat1;
        var dlon = (other.Longitude!.Value - Longitude!.Value) * radians;
        var a = Math.Pow(Math.Sin(dlat / 2), 2) + Math.Cos(lat1) * Math.Cos(lat2) * Math.Pow(Math.Sin(dlon / 2), 2);
        return 6371.0088 * 2 * Math.Asin(Math.Sqrt(Math.Clamp(a, 0, 1)));
    }

    // Regional ranking remains useful when either address has no map coordinates.
    public int RegionRank(AssignmentLocation? other) => other == null ? 4
        : VillageId.HasValue && VillageId == other.VillageId ? 0
        : CityId.HasValue && CityId == other.CityId ? 0
        : CountyId == other.CountyId ? 1
        : ProvinceId == other.ProvinceId ? 2 : 3;
}
