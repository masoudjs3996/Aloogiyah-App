using AlooGiyah_Application.DTOs.BaseDto;
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.ServiceRequest;

public class ServiceRequestFilterDto : BaseFilterDto
{
    public string? UserCode { get; set; } = string.Empty;
    public string? Code { get; set; } = string.Empty;
    public string? StatusCode { get; set; } = string.Empty;
    public ServiceRequestType? ServiceType { get; set; }
}
