using AlooGiyah_Domain.Entities.UserFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class Warehouse : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int WarehouseId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    public int FarmerId { get; set; }
    #endregion

    #region Relations
    [ForeignKey(nameof(FarmerId))]
    public User Farmer { get; set; } = null!;

    public List<WarehouseInventory> WarehouseInventories { get; set; } = null!;
    #endregion
}