using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Users;

public class UpdateUserRolesDto
{
    [Required]
    public List<string> RoleCodes { get; set; } = [];
}
