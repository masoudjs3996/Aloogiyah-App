
using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.Farm;

public class FarmFilterDto : BaseFilterDto
{
    public string? Name { get; set; }
    public string? AddressCode { get; set; }
    public string? UserCode { get; set; }
    public string? StatusCode { get; set; }
}
