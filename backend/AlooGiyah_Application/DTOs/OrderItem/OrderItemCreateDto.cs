using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlooGiyah_Application.DTOs.OrderItem
{
    public class OrderItemCreateDto
    {
        public string ProductCode { get; set; } = string.Empty;
        public string OrderCode { get; set; } = string.Empty;
        public int Quantity { get; set; }
    }
}
