using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Wallet;

public class DepositWalletDto
{
    [Required]
    [Range(1000, 1000000000, ErrorMessage = "مبلغ باید بین 1,000 تا 1,000,000,000 ريال باشد")]
    public decimal Amount { get; set; }

    public string? RedirectUrl { get; set; } // برای بازگشت از درگاه پرداخت
}
