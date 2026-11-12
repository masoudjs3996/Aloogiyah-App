namespace AlooGiyah_Application.DTOs.AgriculturalOrder;
public class OrderHistoryDto
{
    public string Action { get; set; } = string.Empty;
    public string FromStatusCode { get; set; } = string.Empty;
    public string ToStatusCode { get; set; } = string.Empty;
    public int? ActorId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public string? Reason { get; set; }
}
