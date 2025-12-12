namespace AlooGiyah_Application.DTOs.Wallet;

public class WalletDto
{
    public string Code { get; set; } = string.Empty; // کد کیف پول
    public decimal Balance { get; set; }
    public decimal HeldAmount { get; set; } // مبلغ بلوکه‌شده
    public decimal AvailableBalance => Balance - HeldAmount; // موجودی قابل استفاده (محاسبه‌شده)
}