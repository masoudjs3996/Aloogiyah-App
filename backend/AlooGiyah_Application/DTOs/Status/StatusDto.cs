using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.Status;

public class StatusDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public EntityStatus EntityStatus { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}
