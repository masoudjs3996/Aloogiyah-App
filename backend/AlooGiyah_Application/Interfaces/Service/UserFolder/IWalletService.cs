using AlooGiyah_Application.DTOs.Wallet;

namespace AlooGiyah_Application.Interfaces.Service.UserFolder;

public interface IWalletService
{
    Task<WalletDto> GetWalletByUserCodeAsync();
    Task<bool> HoldAmountAsync(decimal amount); // بلوکه مبلغ
    Task<bool> ReleaseHoldAsync(decimal amount); // آزادسازی بلوکه
    Task<bool> DeductAmountAsync(decimal amount); // کم کردن واقعی پس از تأیید
    Task<bool> CheckBalanceAsync(decimal requiredAmount); // چک موجودی (Balance - HeldAmount >= requiredAmount)
    Task<DepositResultDto> DepositAsync(decimal amount, string? redirectUrl);
    Task<bool> ConfirmDepositAsync(string transactionId);
}