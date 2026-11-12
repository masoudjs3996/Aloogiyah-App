using System.ComponentModel.DataAnnotations.Schema;
namespace AlooGiyah_Domain.Entities.Store;

public sealed class AgriculturalProductSpecificationValue : BaseEntity
{
    public int AgriculturalListingId { get; set; }
    public int AgriculturalProductTemplateSpecificationId { get; set; }
    public int AgriculturalProductTemplateSpecificationOptionId { get; set; }

    [ForeignKey(nameof(AgriculturalListingId))]
    public AgriculturalListing Listing { get; set; } = null!;

    [ForeignKey(nameof(AgriculturalProductTemplateSpecificationId))]
    public AgriculturalProductTemplateSpecification Specification { get; set; } = null!;

    [ForeignKey(nameof(AgriculturalProductTemplateSpecificationOptionId))]
    public AgriculturalProductTemplateSpecificationOption Option { get; set; } = null!;
}
