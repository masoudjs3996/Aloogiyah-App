using AlooGiyah_Application.DTOs.OrderItem;

namespace AlooGiyah_Application.DTOs.Order;

public class OrderDto
{
    public string Code { get; set; } = string.Empty;
    public string UserCode { get; set; } = string.Empty;
    public string StatusCode { get; set; } = string.Empty;
    public string? AddressCode { get; set; }
    public string? DiscountCode { get; set; }
    public decimal DiscountAmount { get; set; }
    public bool IsPaid { get; set; } // آیا پرداخت انجام شده است؟
    public DateTimeOffset? PaymentDate { get; set; } // تاریخ پرداخت
    public string? PaymentReference { get; set; } // کد رهگیری پرداخت
    public decimal TotalPrice { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}
