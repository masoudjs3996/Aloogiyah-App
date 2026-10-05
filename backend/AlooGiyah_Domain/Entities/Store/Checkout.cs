using AlooGiyah_Domain.Entities.UserFolder;
namespace AlooGiyah_Domain.Entities.Store;
public class Checkout : BaseEntity
{
    public int CheckoutId { get; set; }
    public int BuyerId { get; set; }
    public Guid CartId { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public string RequestHash { get; set; } = string.Empty;
    public string CartSnapshotJson { get; set; } = string.Empty;
    public decimal PayableAmount { get; set; }
    public bool IsPaid { get; set; }
    public bool IsSubmitted { get; set; }
    public bool IsExpired { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
    public int? DiscountId { get; set; }
    public bool DiscountReserved { get; set; }
    public User Buyer { get; set; } = null!;
    public Discount? Discount { get; set; }
    public List<AgriculturalOrder> Orders { get; set; } = new();
    public List<CheckoutPayment> Payments { get; set; } = new();
}
