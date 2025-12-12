
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.Discount;

public class DiscountUpdateDto
{
    public string Code { get; set; } = string.Empty;
    public DiscountType DiscountType { get; set; } 
    public decimal Value { get; set; }
    public DateTimeOffset? StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }
    public int? MaxUsage { get; set; }
    public bool IsActive { get; set; }
    public int UsageCount { get; set; }
    public List<string> UserCodes { get; set; } = new();
    public List<string> ProductCodes { get; set; } = new();
    public List<string> CategoryCodes { get; set; } = new();
}
