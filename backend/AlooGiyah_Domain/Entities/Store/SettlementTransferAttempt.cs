namespace AlooGiyah_Domain.Entities.Store;

// Durable instruction, written before any real transfer. Unknown results remain reserved.
public class SettlementTransferAttempt : BaseEntity
{
    public int SettlementTransferAttemptId { get; set; }
    public int SettlementRequestId { get; set; }
    public SettlementRequest Request { get; set; } = null!;
    public decimal AmountToman { get; set; }
    public string Iban { get; set; } = "";
    public string Provider { get; set; } = "Manual";
    public string Status { get; set; } = "AwaitingConfirmation";
    public string? ProviderReference { get; set; }
    public int StartedById { get; set; }
    public int? CompletedById { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public string? ResolutionNote { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
}
