
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Location;

public class ProvinceUpdateDto : ProvinceCreateDto
{
    [Required, MaxLength(10)]
    public required string Code { get; set; }
}