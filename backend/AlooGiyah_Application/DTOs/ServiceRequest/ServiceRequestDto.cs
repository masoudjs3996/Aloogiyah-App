
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.ServiceRequest;

public class ServiceRequestDto
{
    public required string Code { get; set; }
    public ServiceRequestType ServiceType { get; set; }
    public string StatusCode { get; set; } = string.Empty;
    public string UserCode { get; set; } = string.Empty;
    public string? ProviderCode { get; set; }
    public string? AddressCode { get; set; }
    public string? AddressStreet { get; set; }
    public string? AddressProvince { get; set; }
    public string? AddressCounty { get; set; }
    public string? AddressCity { get; set; }
    public decimal Price { get; set; }
    public string? DiscountCode { get; set; }
    public decimal DiscountAmount { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTimeOffset? ServiceDate { get; set; }

    public int? NumberOfVases { get; set; }      // تعداد گلدان
    public double? GardenArea { get; set; }      // مساحت باغچه متر مربع
    public double? GreenhouseArea { get; set; }  // متراژ گلخانه 
}
