using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Application.Services;

public sealed class UnavailablePayoutProvider : IPayoutProvider
{
    public string Name => "None";
    public bool IsAvailable => false;
    public Task<PayoutResult> SubmitAsync(PayoutInstruction instruction, CancellationToken cancellationToken = default) =>
        throw new BadRequestException("انتقال خودکار بانکی فعال نیست؛ واریز و ثبت رسید از پنل مدیریت انجام می‌شود.");
    public Task<PayoutResult> QueryAsync(string attemptCode, string? providerReference, CancellationToken cancellationToken = default) =>
        Task.FromResult(new PayoutResult(PayoutOutcome.Unknown, providerReference, "سرویس استعلام بانکی متصل نشده است."));
}
