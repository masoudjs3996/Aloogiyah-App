namespace AlooGiyah_Domain.Entities.Store;

// Separate from buyer wallet credit: only released sales income is withdrawable.
public class SellerReceivable : BaseEntity
{
    public int SellerReceivableId { get; set; }
    public int AgriculturalOrderId { get; set; }
    public AgriculturalOrder Order { get; set; } = null!;
    public int SellerId { get; set; }
    public decimal GrossAmount { get; set; }
    public decimal PlatformDiscountAmount { get; set; }
    public decimal SellerDiscountAmount { get; set; }
    public decimal CommissionRate { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal NetAmount { get; set; }
    public decimal ReleasedAmount { get; set; }
    public DateTimeOffset? ReleasedAt { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
}
