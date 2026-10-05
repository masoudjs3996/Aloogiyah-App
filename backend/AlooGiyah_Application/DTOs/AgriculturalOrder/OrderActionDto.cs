using System.ComponentModel.DataAnnotations;
using AlooGiyah_Domain.Enums;
namespace AlooGiyah_Application.DTOs.AgriculturalOrder;
public class OrderActionDto
{
    [Required] public AgriculturalOrderAction? Action { get; set; }
    [StringLength(1000)] public string? Reason { get; set; }
    [StringLength(100)] public string? ShippingMethod { get; set; }
    [StringLength(100)] public string? TrackingCode { get; set; }
}
