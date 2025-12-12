using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Warehouse;

public class WarehouseUpdateDto
{
    [Required]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }
}
