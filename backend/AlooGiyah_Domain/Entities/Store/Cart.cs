using AlooGiyah_Domain.Entities.UserFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace AlooGiyah_Domain.Entities.Store;

public class Cart : BaseEntity
{
    [Key]
    public Guid CartId { get; set; } = Guid.NewGuid();

    public int? UserId { get; set; }     // فقط برای کاربران ثبت‌نام‌شده
    public Guid? GuestId { get; set; }     // فقط برای کاربران مهمان (شناسه جلسه)

    public int? FarmId { get; set; }     // مزرعه مربوطه (کلید اصلی تمایز سبدها)

    public int? DiscountId { get; set; }

    public decimal TotalPrice { get; set; }
    public decimal DiscountAmount { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [ForeignKey(nameof(FarmId))]
    public Farm? Farm { get; set; }

    [ForeignKey(nameof(DiscountId))]
    public Discount? Discount { get; set; }

    public List<CartItem> CartItems { get; set; } = null!;

}
