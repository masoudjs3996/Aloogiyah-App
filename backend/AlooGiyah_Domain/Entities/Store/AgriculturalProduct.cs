using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.Store;

public class AgriculturalProduct : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AgriculturalProductId { get; set; }
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;
    [Required]
    public decimal RetailPrice { get; set; } // قیمت برای مشتری معمولی
    [Required]
    public decimal WholesalePrice { get; set; } // قیمت برای همکار
    [Required]
    public int Stock { get; set; }


    [Required]
    public int FarmId { get; set; }
    [Required]
    public int StatusId { get; set; }

    public int? DailyProductionCapacity { get; set; }


    [MaxLength(255)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(255)]
    public string MetaTitle { get; set; } = string.Empty;

    [MaxLength(500)]
    public string MetaDescription { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? MetaKeywords { get; set; }
    #endregion

    #region Relations

    [ForeignKey(nameof(FarmId))]
    public Farm Farm { get; set; } = null!;

    [ForeignKey(nameof(StatusId))]
    public Status Status { get; set; } = null!;

    public List<Category> Categories { get; set; } = null!;
    public List<AgriculturalOrderItem> AgriculturalOrderItems { get; set; } = null!;
    public List<CartItem> CartItems { get; set; } = null!;
    public List<Discount> Discounts { get; set; } = null!;
    public List<WarehouseInventory> WarehouseInventories { get; set; } = null!;
    public List<QualityAssessment> QualityAssessments { get; set; } = null!;
    public List<Auction> Auctions { get; set; } = null!;
    #endregion
}