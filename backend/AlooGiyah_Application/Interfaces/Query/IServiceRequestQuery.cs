using AlooGiyah_Application.DTOs.ServiceRequest;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IServiceRequestQuery
{
    Task<ServiceRequestDto?> GetByCodeAsync(string code);
    Task<PagedResult<ServiceRequestDto>> GetPagedAsync(ServiceRequestFilterDto filter);
}
