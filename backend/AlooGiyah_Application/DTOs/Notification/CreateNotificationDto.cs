using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlooGiyah_Application.DTOs.Notification
{
    public class CreateNotificationDto
    {
        [Required]
        public string UserCode { get; set; }
        [Required]
        [MaxLength(1000)]
        public string Message { get; set; } = string.Empty;
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty;
    }
}
