
using AlooGiyah_Application.DTOs.Address;

namespace AlooGiyah_Application.DTOs.Farm;

public class FarmUpdateDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public AddressUpdateDto? Address { get; set; } // به‌روزرسانی آدرس
    public int? Capacity { get; set; }
    public decimal MinPurchase { get; set; }
}
