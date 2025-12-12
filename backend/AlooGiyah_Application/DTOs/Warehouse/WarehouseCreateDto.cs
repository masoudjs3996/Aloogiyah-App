using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Warehouse;

public class WarehouseCreateDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    [Required]
    public string FarmerCode { get; set; } = string.Empty;
}
