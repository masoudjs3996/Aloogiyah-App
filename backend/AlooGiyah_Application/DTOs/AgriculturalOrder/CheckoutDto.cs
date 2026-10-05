namespace AlooGiyah_Application.DTOs.AgriculturalOrder;
public class CheckoutDto
{
    public string PaymentStatus => !IsSubmitted && !IsPaid ? "Pending" :
        Orders.Count > 0 && Orders.All(x => x.IsPaid) ? "Paid" :
        Orders.Any(x => x.IsPaid) ? "PartiallyPaid" : Orders.Any(x => x.IsHeld) ? "Held" : "Released";
    public string Code { get; set; } = string.Empty;
    public decimal PayableAmount { get; set; }
    public bool IsPaid { get; set; }
    public bool IsSubmitted { get; set; }
    public bool IsExpired { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public List<AgriculturalOrderDto> Orders { get; set; } = new();
}
