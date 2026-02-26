using AlooGiyah_Application.DTOs.StatusChangeLog;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service;

public interface IStatusChangeLogService
{
    Task<StatusChangeLogDto> CreateAsync(StatusChangeLogCreateDto dto);
    Task<bool> UpdateAsync(StatusChangeLogUpdateDto dto);
    Task<bool> DeleteAsync(string code);
    Task<StatusChangeLogDto?> GetByCodeAsync(string code);
    Task<PagedResult<StatusChangeLogDto>> GetByFilterAsync(StatusChangeLogFilterDto filter);
}
