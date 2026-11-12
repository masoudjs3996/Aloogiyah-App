using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.Store;

public sealed class AgriculturalProductTemplateSpecification : BaseEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AgriculturalProductTemplateSpecificationId { get; set; }

    public int AgriculturalProductTemplateId { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public bool IsRequired { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    [ForeignKey(nameof(AgriculturalProductTemplateId))]
    public AgriculturalProductTemplate Template { get; set; } = null!;

    public List<AgriculturalProductTemplateSpecificationOption> Options { get; set; } = [];
}
