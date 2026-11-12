using AlooGiyah_Application.DTOs.Status;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IStatusQuery
{
    Task<StatusDto?> GetByCodeAsync(string code);
    Task<PagedResult<StatusDto>> GetByFilterAsync(StatusFilterDto filter);
}
