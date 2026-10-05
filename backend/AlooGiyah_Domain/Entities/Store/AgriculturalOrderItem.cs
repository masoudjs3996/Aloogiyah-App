using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.Store;

public class AgriculturalOrderItem : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AgriculturalOrderItemId { get; set; }
    public string ProductCodeSnapshot { get; set; } = string.Empty;
    public string ProductNameSnapshot { get; set; } = string.Empty;
    public string ProductSlugSnapshot { get; set; } = string.Empty;

    [Required]
    public int Quantity { get; set; }

    [Required]
    public decimal Price { get; set; }

    [Required]
    public int AgriculturalOrderId { get; set; }

    [Required]
    public int AgriculturalProductId { get; set; }
    #endregion

    #region Relations

    [ForeignKey(nameof(AgriculturalOrderId))]
    public AgriculturalOrder AgriculturalOrder { get; set; } = null!;

    [ForeignKey(nameof(AgriculturalProductId))]
    public AgriculturalProduct AgriculturalProduct { get; set; } = null!;

    #endregion
}