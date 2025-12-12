
namespace AlooGiyah_Application.DTOs.Wallet;

public class DepositResultDto
{
    public string TransactionId { get; set; } = string.Empty; // کد تراکنش
    public string PaymentUrl { get; set; } = string.Empty; // URL درگاه پرداخت
    public decimal NewBalance { get; set; } // موجودی جدید
}
