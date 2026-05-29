using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlooGiyah_Application.DTOs.Farm
{
    public class FarmListDto
    {
        public string FarmCode { get; set; } = string.Empty;
        public string FarmName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public string? FarmImageUrl { get; set; }

        public string UserCode { get; set; } = string.Empty;
        public string UserFullName { get; set; } = string.Empty;

        public string? UserImageUrl { get; set; }
    }
}
