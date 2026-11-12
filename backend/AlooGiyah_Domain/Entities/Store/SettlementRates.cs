namespace AlooGiyah_Domain.Entities.Store;

// Append-only versions: existing order income retains its original rates and amounts.
public class SettlementRates : BaseEntity
{
    public int SettlementRatesId { get; set; }
    public decimal CommissionRate { get; set; }
    public decimal TaxRate { get; set; }
    public int ChangedById { get; set; }
    public string Reason { get; set; } = "";
}
