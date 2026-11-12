using AlooGiyah_Application.DTOs.StatusChangeLog;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IStatusChangeLogQuery
{
    Task<StatusChangeLogDto?> GetByCodeAsync(string code);
    Task<PagedResult<StatusChangeLogDto>> GetByFilterAsync(StatusChangeLogFilterDto filter);
}
