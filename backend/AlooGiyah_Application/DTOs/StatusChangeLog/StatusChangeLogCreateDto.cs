
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.StatusChangeLog;

public class StatusChangeLogCreateDto
{
    public int EntityId { get; set; }
    public EntityStatus EntityStatus { get; set; } 
    public string? Comments { get; set; }
    public string OldStatusCode { get; set; } = string.Empty;
    public string NewStatusCode { get; set; } = string.Empty;

}
