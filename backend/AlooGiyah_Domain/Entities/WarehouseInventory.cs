using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Entities.Store;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class WarehouseInventory : BaseEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int WarehouseInventoryId { get; set; }

    [Required]
    public int WarehouseId { get; set; }

    [Required]
    public int EntityId { get; set; }

    [Required]
    public EntityWarehouseInventory EntityWarehouse { get; set; }

    // SQL foreign keys for the polymorphic target exposed by EntityId/EntityWarehouse.
    public int? AgriculturalProductId { get; set; }
    public AgriculturalProduct? AgriculturalProduct { get; set; }
    public int? ProductId { get; set; }
    public Product? Product { get; set; }

    [Required]
    public int Quantity { get; set; }

    public DateTimeOffset? LastRestockDate { get; set; }

    [ForeignKey(nameof(WarehouseId))]
    public Warehouse Warehouse { get; set; } = null!;
}