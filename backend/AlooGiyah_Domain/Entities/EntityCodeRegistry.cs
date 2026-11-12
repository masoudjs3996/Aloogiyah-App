using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Domain.Entities;

public class EntityCodeRegistry
{
    [Key, MaxLength(10)]
    public string Code { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string EntityType { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }
}
