namespace AlooGiyah_Domain.Entities.Store;
public class AgriculturalOrderHistory : BaseEntity
{
    public int AgriculturalOrderHistoryId { get; set; }
    public int AgriculturalOrderId { get; set; }
    public int? ActorId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string FromStatusCode { get; set; } = string.Empty;
    public string ToStatusCode { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public AgriculturalOrder Order { get; set; } = null!;
}
