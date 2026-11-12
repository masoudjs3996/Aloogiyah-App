namespace AlooGiyah_Application.DTOs.AgriculturalProduct;
public class SavedProductDto
{
        public string? SaleUnit { get; set; }

    public string ProductCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? PrimaryImageUrl { get; set; }
    public string FarmName { get; set; } = string.Empty;
    public decimal RetailPrice { get; set; }
    public int Stock { get; set; }
    public bool IsAvailable { get; set; }
}
