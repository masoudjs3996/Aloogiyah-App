using AlooGiyah_Domain.Entities.UserFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace AlooGiyah_Domain.Entities.Store;

public class Cart : BaseEntity
{
    [Key]
    public Guid CartId { get; set; } = Guid.NewGuid();

    public int? UserId { get; set; } // null = مهمان، پر شده = کاربر لاگین کرده

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    public List<CartItem> CartItems { get; set; } = new();
}
