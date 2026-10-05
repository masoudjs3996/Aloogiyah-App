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
    // Nullable only for historical orders; every new order has both values.
    public int? FarmId { get; set; }
    public int? CheckoutId { get; set; }
    public Farm? Farm { get; set; }
    public Checkout? Checkout { get; set; }
    public decimal Subtotal { get; set; }
    public decimal ShippingAmount { get; set; }
    // TotalPrice is always the final payable amount in the new flow.
    public string FarmNameSnapshot { get; set; } = string.Empty;
    public string AddressSnapshotJson { get; set; } = string.Empty;
    public bool InventoryReserved { get; set; }
    public string? RejectionReason { get; set; }
    public string? ShippingMethod { get; set; }
    public string? TrackingCode { get; set; }
    public DateTimeOffset? ShippedAt { get; set; }
    public DateTimeOffset? DeliveredAt { get; set; }
    public int? DeliveredById { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
    public List<AgriculturalOrderHistory> History { get; set; } = new();
    public OrderRefund? Refund { get; set; }

    [Required]
    public int StatusId { get; set; }

    public decimal TotalPrice { get; set; }

    public int AddressId { get; set; }

    public int? DiscountId { get; set; }

    public decimal DiscountAmount { get; set; }

    public bool IsPaid { get; set; } // آیا پرداخت انجام شده است؟
    public DateTimeOffset? PaymentDate { get; set; } // تاریخ پرداخت
    public string? PaymentReference { get; set; }

    public bool IsHeld { get; set; } = false; // آیا مبلغ بلوکه شده؟
    public DateTimeOffset? ApprovalExpiresAt { get; set; }
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