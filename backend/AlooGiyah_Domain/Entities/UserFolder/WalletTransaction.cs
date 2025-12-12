using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.UserFolder;

public class WalletTransaction : BaseEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int TransactionId { get; set; }

    [Required]
    public int WalletId { get; set; }

    [Required]
    public decimal Amount { get; set; }

    [Required]
    public WalletTransactionType TransactionType { get; set; }

    public string? ReferenceId { get; set; } // مثلاً کد تراکنش درگاه پرداخت

    public string? Description { get; set; } // توضیحات (مثلاً "شارژ کیف پول")

    #region Relations
    [ForeignKey(nameof(WalletId))]
    public Wallet Wallet { get; set; } = null!;
    #endregion
}