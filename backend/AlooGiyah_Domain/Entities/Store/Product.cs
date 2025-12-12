using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.Store;

public class Product : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ProductId { get; set; }

    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public decimal RetailPrice { get; set; } // قیمت برای مشتری معمولی

    [Required]
    public decimal WholesalePrice { get; set; } // قیمت برای همکار

    [Required]
    public int Stock { get; set; }


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

    public List<Category> Categories { get; set; } = null!;
    public List<OrderItem> OrderItems { get; set; } = null!;
    public List<WarehouseInventory> WarehouseInventories { get; set; } = null!;
    public List<Discount> Discounts { get; set; } = null!;
    #endregion
}