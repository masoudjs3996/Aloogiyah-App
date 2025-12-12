using System.ComponentModel.DataAnnotations;
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.Status;

public class StatusCreateDto
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public EntityStatus EntityStatus { get; set; }
}
