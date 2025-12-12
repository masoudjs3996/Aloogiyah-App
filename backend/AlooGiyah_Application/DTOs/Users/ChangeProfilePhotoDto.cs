using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Users;

public class ChangeProfilePhotoDto
{
    [Required]
    public IFormFile File { get; set; } = null!;
}
