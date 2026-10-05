using AlooGiyah_Application.DTOs.AgriculturalOrderItem;
namespace AlooGiyah_Application.DTOs.AgriculturalOrder;

public class AgriculturalOrderDto
{
    public string PaymentStatus => IsHeld ? "Held" : IsPaid ? "Paid" : ApprovalExpiresAt.HasValue ? "Released" : "Pending";
    public string Code { get; set; } = string.Empty;
    public string? CheckoutCode { get; set; }
    public string? FarmCode { get; set; }
    public string FarmName { get; set; } = string.Empty;
    public string StatusTitle { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal ShippingAmount { get; set; }
    public OrderAddressDto? Address { get; set; }
    public string? RejectionReason { get; set; }
    public string? ShippingMethod { get; set; }
    public string? TrackingCode { get; set; }
    public DateTimeOffset? ShippedAt { get; set; }
    public DateTimeOffset? DeliveredAt { get; set; }
    public string RefundStatus { get; set; } = "None";
    public decimal RefundAmount { get; set; }
    public string? RefundReference { get; set; }
    public DateTimeOffset? RefundCompletedAt { get; set; }
    public string? PaymentReference { get; set; }
    public DateTimeOffset? PaymentDate { get; set; }
    public List<string> AllowedActions { get; set; } = new();
    public List<OrderHistoryDto> History { get; set; } = new();
    public string StatusCode { get; set; } = string.Empty;
    public string BuyerCode { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public bool IsPaid { get; set; }
    public bool IsHeld { get; set; }
    public DateTimeOffset? ApprovalExpiresAt { get; set; }
    public decimal HeldAmount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public List<AgriculturalOrderItemDto> OrderItems { get; set; } = new();
}
