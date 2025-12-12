using AlooGiyah_Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.ServiceRequest
{
    public class ServiceRequestCreateDto
    {
        [Required]
        public ServiceRequestType ServiceType { get; set; }


        public string? DiscountCode { get; set; }
        public decimal DiscountAmount { get; set; }
        public string StatusCode { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTimeOffset? ServiceDate { get; set; }

        public int? NumberOfVases { get; set; }      // تعداد گلدان
        public double? GardenArea { get; set; }      // مساحت باغچه متر مربع
        public double? GreenhouseArea { get; set; }  // متراژ گلخانه 
    }
}
