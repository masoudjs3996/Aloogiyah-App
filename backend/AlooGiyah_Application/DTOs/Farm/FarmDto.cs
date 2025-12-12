
using AlooGiyah_Application.DTOs.Address;

namespace AlooGiyah_Application.DTOs.Farm;

public class FarmDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string OwnerCode { get; set; } = string.Empty;
    public AddressDto? Address { get; set; }
    public int? Capacity { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public decimal MinPurchase { get; set; }
    public string? ImageUrl { get; set; }
}
