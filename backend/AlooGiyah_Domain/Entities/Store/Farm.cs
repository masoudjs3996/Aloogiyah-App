using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.Store;

public class Farm : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int FarmId { get; set; }

    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public int OwnerId { get; set; }

    public int? AddressId { get; set; }
    public int StatusId { get; set; }

    public int? Capacity { get; set; }

    public decimal MinPurchase {get; set; }
    #endregion

    #region Relations
    [ForeignKey(nameof(OwnerId))]
    public required User Owner { get; set; } 

    [ForeignKey(nameof(AddressId))]
    public Address? Address { get; set; }

    [ForeignKey(nameof(StatusId))]
    public required Status Status { get; set; } 

    public ICollection<AgriculturalProduct> AgriculturalProduct { get; set; } = [];
    #endregion
}