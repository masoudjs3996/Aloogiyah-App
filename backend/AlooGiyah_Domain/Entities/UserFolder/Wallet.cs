using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.UserFolder;

public class Wallet : BaseEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int WalletId { get; set; }

    [Required]
    public int UserId { get; set; } 

    [Required]
    public decimal Balance { get; set; } = 0; // موجودی واقعی

    [Required]
    public decimal HeldAmount { get; set; } = 0; // مبلغ بلوکه‌شده

    #region Relations
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
    #endregion
}