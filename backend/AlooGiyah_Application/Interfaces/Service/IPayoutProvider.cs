namespace AlooGiyah_Application.Interfaces.Service;

// Receiving a customer payment does not imply support for outgoing transfers.
public interface IPayoutProvider
{
    string Name { get; }
    bool IsAvailable { get; }
    Task<PayoutResult> SubmitAsync(PayoutInstruction instruction, CancellationToken cancellationToken = default);
    Task<PayoutResult> QueryAsync(string attemptCode, string? providerReference, CancellationToken cancellationToken = default);
}
public record PayoutInstruction(string AttemptCode, decimal AmountToman, string Iban);
public enum PayoutOutcome { Unknown, Pending, Succeeded, Failed }
public record PayoutResult(PayoutOutcome Outcome, string? ProviderReference, string? Message);
