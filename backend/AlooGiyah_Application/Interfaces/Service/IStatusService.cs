using AlooGiyah_Application.DTOs.Status;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service;

public interface IStatusService
{
    Task<StatusDto> CreateAsync(StatusCreateDto dto);
    Task<bool> UpdateAsync(StatusUpdateDto dto);
    Task<bool> DeleteAsync(string code);
    Task<StatusDto?> GetByCodeAsync(string code);
    Task<PagedResult<StatusDto>> GetByFilterAsync(StatusFilterDto filter);
}