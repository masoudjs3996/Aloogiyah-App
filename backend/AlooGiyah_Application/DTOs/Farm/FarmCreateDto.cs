
using AlooGiyah_Application.DTOs.Address;
using Microsoft.AspNetCore.Http;

namespace AlooGiyah_Application.DTOs.Farm;

public class FarmCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public AddressCreateDto? Address { get; set; } // آدرس جدید
    public int? Capacity { get; set; }
    public decimal MinPurchase { get; set; }
    public IFormFile? Image { get; set; }
}
