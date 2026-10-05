namespace AlooGiyah_Domain.Entities.Store;
public class OrderRefund : BaseEntity
{
    public int OrderRefundId { get; set; }
    public int AgriculturalOrderId { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Pending";
    public string Reason { get; set; } = string.Empty;
    public DateTimeOffset? CompletedAt { get; set; }
    public int? CompletedById { get; set; }
    public string? Reference { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
    public AgriculturalOrder Order { get; set; } = null!;
}
