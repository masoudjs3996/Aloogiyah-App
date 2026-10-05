using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.Location;

public class LocationFilterDto : BaseFilterDto
{
    public string? SearchTerm { get; set; }
    public string? StatusCode { get; set; }


}