using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.Store;

public class AgriculturalOrderItem : BaseEntity
{
    [System.ComponentModel.DataAnnotations.MaxLength(16)]
    public string? SaleUnit { get; set; }

    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AgriculturalOrderItemId { get; set; }
    public string ProductCodeSnapshot { get; set; } = string.Empty;
    public string ProductNameSnapshot { get; set; } = string.Empty;
    public string ProductSlugSnapshot { get; set; } = string.Empty;

    [Required]
    public int Quantity { get; set; }
    public int ReceivedAtHubQuantity { get; set; }
    public int ReceivedAtOriginQuantity { get; set; }
    public int DeliveredQuantity { get; set; }
    public Guid DeliveryVersion { get; set; } = Guid.NewGuid();

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
