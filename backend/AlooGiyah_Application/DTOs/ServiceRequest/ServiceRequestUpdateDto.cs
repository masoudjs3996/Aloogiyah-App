
namespace AlooGiyah_Application.DTOs.ServiceRequest;

 public class ServiceRequestUpdateDto
{
    public required string Code { get; set; } 
    public string? StatusCode { get; set; }
    public string? ProviderCode { get; set; }
    public string? AddressCode { get; set; }
    public decimal? Price { get; set; }
    public string? DiscountCode { get; set; }
    public decimal? DiscountAmount { get; set; }
    public string? Description { get; set; }
    public DateTimeOffset? ServiceDate { get; set; }

    public int? NumberOfVases { get; set; }      // تعداد گلدان
    public double? GardenArea { get; set; }      // مساحت باغچه متر مربع
    public double? GreenhouseArea { get; set; }  // متراژ گلخانه 
}
