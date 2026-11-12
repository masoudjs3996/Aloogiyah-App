namespace AlooGiyah_Application.DTOs.Wallet;

public record SettlementCreateDto(decimal Amount, string Iban, string AccountHolder, string IdempotencyKey);
public record SettlementActionDto(string Action, string? Note, string? TransferReference);
public record SettlementCalendarDto(DateOnly From, DateOnly To, List<DateOnly> Holidays);
public record SettlementRatesDto(decimal CommissionRate, decimal TaxRate, string Reason);
public record SettlementHistoryDto(string Action, string? Note, DateTimeOffset CreatedAt);
public record SettlementAttemptDto(string Code, string Provider, string Status, decimal AmountToman,
    string? ProviderReference, DateTimeOffset CreatedAt, DateTimeOffset? CompletedAt, string? ResolutionNote);
public record SettlementDto(string Code, decimal Amount, string Iban, string AccountHolder, string Status,
    DateTimeOffset CreatedAt, DateOnly? ScheduledDate, DateOnly CycleSaturday, DateTimeOffset CutoffAt,
    string? TransferReference, DateTimeOffset? PaidAt, List<SettlementHistoryDto> History,
    List<SettlementAttemptDto> TransferAttempts);
public record SellerIncomeDto(string OrderCode, decimal GrossAmount, decimal CommissionRate, decimal CommissionAmount,
    decimal TaxRate, decimal TaxAmount, decimal NetAmount, decimal ReleasedAmount, DateTimeOffset? ReleasedAt,
    decimal PlatformDiscountAmount = 0, decimal SellerDiscountAmount = 0);
public record SettlementSummaryDto(decimal Reserved, decimal Available, decimal Pending, decimal Paid,
    decimal CommissionRate, decimal TaxRate, bool CanManage, DateOnly? NextPaymentDate, string? CalendarWarning);
public record SettlementPageDto<T>(List<T> Items, int TotalCount, int PageNumber, int PageSize);
