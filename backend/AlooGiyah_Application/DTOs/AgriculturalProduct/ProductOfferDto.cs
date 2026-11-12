using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.AgriculturalProduct;

public class ProductOfferDto
{
    [Required]
    public string ProductCode { get; set; } = string.Empty;
    [Range(typeof(decimal), "0", "100")]
    public decimal Percentage { get; set; }
    public DateTimeOffset? EndDate { get; set; }
}
