
using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.Address;

public class AddressFilterDto : BaseFilterDto
{
    public string? PostalCode { get; set; }
    public string? SearchTerm { get; set; }
    public bool? IsDefault { get; set; }
}