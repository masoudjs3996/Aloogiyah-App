using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Domain.Entities.Store;

public sealed class AgriculturalListing : BaseEntity
{
    public int AgriculturalListingId { get; set; }
    public int FarmId { get; set; }
    public Farm Farm { get; set; } = null!;
    public int? AgriculturalProductTemplateId { get; set; }
    public AgriculturalProductTemplate? ProductTemplate { get; set; }
    [MaxLength(10)] public string? LegacyProductCode { get; set; }
    [MaxLength(255)] public string Name { get; set; } = "";
    [MaxLength(1000)] public string Description { get; set; } = "";
    [MaxLength(255)] public string Slug { get; set; } = "";
    [MaxLength(16)] public string? SaleUnit { get; set; }
    public decimal RetailPrice { get; set; }
    public int Stock { get; set; }
    public int? DailyProductionCapacity { get; set; }
    public bool IsPublished { get; set; } = true;
    public List<string> ImageUrls { get; set; } = [];
    public List<Category> Categories { get; set; } = [];
    public List<AgriculturalProductSpecificationValue> SpecificationValues { get; set; } = [];
    public List<ProductInquiry> Inquiries { get; set; } = [];
}
