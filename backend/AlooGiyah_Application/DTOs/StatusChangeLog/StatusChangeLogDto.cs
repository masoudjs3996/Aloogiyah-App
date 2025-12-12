
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.StatusChangeLog;

public class StatusChangeLogDto
{
    public string Code { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public EntityStatus EntityStatus { get; set; } 
    public string? Comments { get; set; }
    public string OldStatusCode { get; set; } = string.Empty;
    public string NewStatusCode { get; set; } = string.Empty;
    public string UserCode { get; set; } = string.Empty;
    public DateTimeOffset ChangeDate { get; set; }
}
