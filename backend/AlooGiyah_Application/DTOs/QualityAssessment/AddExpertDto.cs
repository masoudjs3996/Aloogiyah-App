
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.QualityAssessment
{
    public class AddExpertDto
    {
        [Required]
        public string Code { get; set; } = string.Empty;

        [Required]
        public string ExpertCode { get; set; } = string.Empty;
    }
}
