using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Domain.Entities;

public class Slider : BaseEntity
{
    [Key]
    public int SliderId { get; set; }

    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? LinkUrl { get; set; }

    public int Order { get; set; }

    public bool IsActive { get; set; } = true;
}
