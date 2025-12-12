using AlooGiyah_Application.DTOs.AgriculturalOrderItem;
using System.ComponentModel.DataAnnotations;


namespace AlooGiyah_Application.DTOs.AgriculturalOrder
{
    public class AgriculturalOrderCreateDto
    {

        public required string AddressCode { get; set; }
        public string? DiscountCode { get; set; }

        [Required]
        [MinLength(1)]
        public List<AgriculturalOrderItemCreateDto> OrderItems { get; set; } = new();
    }

}
