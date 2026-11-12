using System.ComponentModel.DataAnnotations;
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.Discount;

public record SellerCustomerDto(string Code, string Name, int OrderCount, decimal PurchasedAmount, DateTimeOffset LastOrderAt);
public record SellerSalesSummaryDto(int CustomerCount, int OrderCount, decimal PurchasedAmount, int ActiveDiscounts);
public record SellerProductDto(string Code, string Name, string FarmCode, string FarmName);
public record SellerCustomerOrderDto(string Code, string FarmName, decimal TotalPrice, bool IsPaid, string Status, DateTimeOffset CreatedAt);
public record SellerDiscountDto(string Code, string CustomerCode, string CustomerName, string FarmCode, string FarmName,
    DiscountType DiscountType, decimal Value, decimal? MaxDiscountAmount, DateTimeOffset? EndDate,
    int UsageCount, int? MaxUsage, bool IsActive, List<string> ProductCodes);
public class SellerDiscountCreateDto
{
    [Required, StringLength(50)] public string CustomerCode { get; set; } = "";
    [Required, StringLength(50)] public string FarmCode { get; set; } = "";
    public List<string> ProductCodes { get; set; } = new();
    public DiscountType DiscountType { get; set; }
    public decimal Value { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public DateTimeOffset EndDate { get; set; }
    public int MaxUsage { get; set; } = 1;
}
