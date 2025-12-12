using AlooGiyah_Application.Utils;
using AlooGiyah_Domain.Enums;
using System.Text.Json.Serialization;


namespace AlooGiyah_Application.DTOs.Discount;

public class DiscountDto
{
    public string Code { get; set; } = string.Empty;
    public DiscountType DiscountType { get; set; } 
    public decimal Value { get; set; }
    public DateTimeOffset? StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }
    public int? MaxUsage { get; set; }
    public int UsageCount { get; set; }
    public bool IsActive { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public List<string>? UserCodes { get; set; } 
    public List<string>? ProductCodes { get; set; } 
    public List<string>? CategoryCodes { get; set; } 
    public string? FarmCode { get; set; } 

    [JsonIgnore] 
    public AlooGiyah_Domain.Entities.Discount? Entity { get; set; } 


    public string Description => Entity?.GetDiscountDescription() ?? "تخفیف نامشخص";
}

