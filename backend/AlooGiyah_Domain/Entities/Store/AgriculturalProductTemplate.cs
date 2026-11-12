using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AlooGiyah_Domain.Entities;

namespace AlooGiyah_Domain.Entities.Store;

/// <summary>
/// An administrator-owned definition of a sellable product type, such as rose
/// or chrysanthemum. Categories are only used to organise these definitions.
/// </summary>
public sealed class AgriculturalProductTemplate : BaseEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AgriculturalProductTemplateId { get; set; }

    public int CategoryId { get; set; }

    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(16)]
    public string? DefaultSaleUnit { get; set; }

    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    [ForeignKey(nameof(CategoryId))]
    public Category Category { get; set; } = null!;

    public List<AgriculturalProductTemplateSpecification> Specifications { get; set; } = [];
    public List<AgriculturalListing> Listings { get; set; } = [];
}
