using System.ComponentModel.DataAnnotations;
using AlooGiyah_Application.DTOs.OrderItem;

namespace AlooGiyah_Application.DTOs.Order
{
    public class OrderUpdateDto
    {
        [Required]
        public string OrderCode { get; set; } = string.Empty;

        [Required]
        public string StatusCode { get; set; } = string.Empty;  // کد وضعیت سفارش

        public string? DiscountCode { get; set; }  // کد تخفیف اختیاری

        public string? AddressCode { get; set; }  // کد آدرس اختیاری

        [Required]
        public List<OrderItemUpdateDto> Items { get; set; } = new();    
    }
}
