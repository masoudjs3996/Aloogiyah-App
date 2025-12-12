using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.Store;

public class AgriculturalOrder : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AgriculturalOrderId { get; set; }

    [Required]
    public int StatusId { get; set; }

    public decimal TotalPrice { get; set; }

    [Required]
    public int AddressId { get; set; }

    public int? DiscountId { get; set; }

    public decimal DiscountAmount { get; set; }

    public bool IsPaid { get; set; } // آیا پرداخت انجام شده است؟
    public DateTimeOffset? PaymentDate { get; set; } // تاریخ پرداخت
    public string? PaymentReference { get; set; }

    public bool IsHeld { get; set; } = false; // آیا مبلغ بلوکه شده؟
    public decimal HeldAmount { get; set; } = 0; // مبلغ بلوکه‌شده برای این سفارش

    [Required]
    public int BuyerId { get; set; }
    #endregion

    #region Relations
    [ForeignKey(nameof(StatusId))]
    public Status Status { get; set; } = null!;

    [ForeignKey(nameof(BuyerId))]
    public User Buyer { get; set; } = null!;

    [ForeignKey(nameof(DiscountId))]
    public Discount Discount { get; set; } = null!;

    [ForeignKey(nameof(AddressId))]
    public Address Address { get; set; } = null!;

    public List<AgriculturalOrderItem> AgriculturalOrderItems { get; set; } = null!;
    #endregion
}