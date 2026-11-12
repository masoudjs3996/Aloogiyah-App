using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.Store;

public sealed class AgriculturalProductTemplateSpecificationOption : BaseEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AgriculturalProductTemplateSpecificationOptionId { get; set; }

    public int AgriculturalProductTemplateSpecificationId { get; set; }

    [Required, MaxLength(100)]
    public string Label { get; set; } = string.Empty;

    [MaxLength(7)] public string? ColorHex { get; set; }
    [MaxLength(12)] public string? Icon { get; set; }

    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    [ForeignKey(nameof(AgriculturalProductTemplateSpecificationId))]
    public AgriculturalProductTemplateSpecification Specification { get; set; } = null!;
}
