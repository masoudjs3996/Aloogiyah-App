using System.ComponentModel.DataAnnotations;
namespace AlooGiyah_Application.DTOs.AgriculturalOrder;
// Legacy DTO retained only for compile compatibility; UpdateAsync always rejects.
public class AgriculturalOrderUpdateDto
{
    [Required] public string Code { get; set; } = string.Empty;
}
