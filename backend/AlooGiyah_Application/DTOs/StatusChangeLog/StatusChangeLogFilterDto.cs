
using AlooGiyah_Application.DTOs.BaseDto;
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.StatusChangeLog;

public class StatusChangeLogFilterDto : BaseFilterDto
{
    public int? EntityId { get; set; }
    public EntityStatus? EntityStatus { get; set; }
    public string? UserCode { get; set; }
    public string? StatusCode { get; set; }
    public DateTimeOffset? StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }
}
