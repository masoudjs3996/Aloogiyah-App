using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.Store;

public class Order : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int OrderId { get; set; }

    [Required]
    public int StatusId { get; set; }

    public decimal TotalPrice { get; set; }

    [Required]
    public int UserId { get; set; }

    public int? AddressId { get; set; } 

    public int? DiscountId { get; set; }  // کد تخفیف استفاده‌شده (اختیاری)

    public decimal DiscountAmount { get; set; }  // مقدار تخفیف اعمال‌شده
    
    public bool IsPaid { get; set; } // آیا پرداخت انجام شده است؟
    public DateTimeOffset? PaymentDate { get; set; } // تاریخ پرداخت
    public string? PaymentReference { get; set; } // کد رهگیری پرداخت
    
    #endregion

    #region Relations

    [ForeignKey(nameof(StatusId))]
    public Status Status { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [ForeignKey(nameof(DiscountId))]
    public Discount Discount { get; set; } = null!;

    [ForeignKey(nameof(AddressId))]
    public Address Address { get; set; } = null!;

    public List<OrderItem> OrderItems { get; set; } = null!;

    #endregion
}