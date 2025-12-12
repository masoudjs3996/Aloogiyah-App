
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.Discount;

public class DiscountCreateDto
{
    public DiscountType DiscountType { get; set; }
    public decimal Value { get; set; }
    public DateTimeOffset? StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }
    public int? MaxUsage { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public bool IsActive { get; set; }

    public string FarmCode { get; set; } = string.Empty;
    public List<string> UserCodes { get; set; } = new(); 
    public List<string> ProductCodes { get; set; } = new(); 
    public List<string> CategoryCodes { get; set; } = new();


}
