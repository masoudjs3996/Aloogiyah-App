using AlooGiyah_Application.DTOs.BaseDto;
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.Status;

public class StatusFilterDto : BaseFilterDto
{
    public string? Name { get; set; }
    public EntityStatus? EntityStatus { get; set; }
}
