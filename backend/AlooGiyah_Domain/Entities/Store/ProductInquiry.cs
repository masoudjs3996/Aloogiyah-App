using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AlooGiyah_Domain.Entities.UserFolder;

namespace AlooGiyah_Domain.Entities.Store;

public sealed class ProductInquiry : BaseEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ProductInquiryId { get; set; }

    public int ListingId { get; set; }
    public int BuyerId { get; set; }
    public int SellerId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal EstimatedTotal { get; set; }

    [Required, MaxLength(32)]
    public string Status { get; set; } = "Requested";

    [Required, MaxLength(255)]
    public string ProductNameSnapshot { get; set; } = string.Empty;

    [Required, MaxLength(255)]
    public string FarmNameSnapshot { get; set; } = string.Empty;

    [MaxLength(16)]
    public string? SaleUnitSnapshot { get; set; }

    [MaxLength(1000)]
    public string? BuyerMessage { get; set; }

    public DateTimeOffset? RespondedAt { get; set; }

    [ForeignKey(nameof(ListingId))]
    public AgriculturalListing Listing { get; set; } = null!;

    [ForeignKey(nameof(BuyerId))]
    public User Buyer { get; set; } = null!;

    [ForeignKey(nameof(SellerId))]
    public User Seller { get; set; } = null!;
}
