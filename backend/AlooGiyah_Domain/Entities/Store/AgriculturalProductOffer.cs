namespace AlooGiyah_Domain.Entities.Store;

// Automatic product pricing; independent of checkout coupon codes.
public class AgriculturalProductOffer : BaseEntity
{
    public int AgriculturalProductOfferId { get; set; }
    public int AgriculturalProductId { get; set; }
    public decimal Percentage { get; set; }
    public DateTimeOffset StartsAt { get; set; }
    public DateTimeOffset EndsAt { get; set; }
    public bool IsActive { get; set; }
    public AgriculturalProduct AgriculturalProduct { get; set; } = null!;
}
