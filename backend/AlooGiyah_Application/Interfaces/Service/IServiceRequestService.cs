using AlooGiyah_Application.DTOs.ServiceRequest;
using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service;

public interface IServiceRequestService
{
    Task<ServiceRequestDto> CreateAsync(ServiceRequestCreateDto dto);
    Task<ServiceRequestDto?> GetByCodeAsync(string code);
    Task<PagedResult<ServiceRequestDto>> GetPagedAsync(ServiceRequestFilterDto filter);
    Task<bool> UpdateAsync(ServiceRequestUpdateDto dto);
    Task<UserDto> AddProviderAsync(AddProviderDto dto);
    Task<bool> DeleteAsync(string code);
}
