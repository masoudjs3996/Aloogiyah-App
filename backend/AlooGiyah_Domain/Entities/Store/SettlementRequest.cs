namespace AlooGiyah_Domain.Entities.Store;

public class SettlementRequest : BaseEntity
{
    public int SettlementRequestId { get; set; }
    public int SellerId { get; set; }
    public decimal Amount { get; set; }
    public string Iban { get; set; } = "";
    public string AccountHolder { get; set; } = "";
    public string IdempotencyKey { get; set; } = "";
    public string Status { get; set; } = "Pending";
    public DateOnly? ScheduledDate { get; set; }
    public DateOnly CycleSaturday { get; set; }
    public DateTimeOffset CutoffAt { get; set; }
    public string? TransferReference { get; set; }
    public DateTimeOffset? PaidAt { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
    public List<SettlementHistory> History { get; set; } = new();
    public List<SettlementTransferAttempt> TransferAttempts { get; set; } = new();
}

public class SettlementHistory : BaseEntity
{
    public int SettlementHistoryId { get; set; }
    public int SettlementRequestId { get; set; }
    public int ActorId { get; set; }
    public string Action { get; set; } = "";
    public string? Note { get; set; }
}

// Each date must be explicitly confirmed by management. Never guess public holidays.
public class SettlementCalendarDay : BaseEntity
{
    public int SettlementCalendarDayId { get; set; }
    public DateOnly Date { get; set; }
    public bool IsClosed { get; set; }
    public int ConfirmedById { get; set; }
}
