using AlooGiyah_Domain.Entities;

namespace AlooGiyah_Domain.Entities.Store;

public class DeliveryCategoryTariff : BaseEntity
{
    public int DeliveryCategoryTariffId { get; set; }
    public int DeliveryRouteId { get; set; }
    public DeliveryRoute Route { get; set; } = null!;
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public string SaleUnit { get; set; } = "";
    public int BlockSize { get; set; }
    public decimal PricePerBlock { get; set; }
}
