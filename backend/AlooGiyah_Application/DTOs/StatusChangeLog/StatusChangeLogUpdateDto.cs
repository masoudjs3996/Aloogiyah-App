
namespace AlooGiyah_Application.DTOs.StatusChangeLog;

public class StatusChangeLogUpdateDto
{
    public string Code { get; set; } = string.Empty;
    public string? Comments { get; set; }
    public string OldStatusCode { get; set; } = string.Empty;
    public string NewStatusCode { get; set; } = string.Empty;
    public string UserCode { get; set; } = string.Empty;
}
