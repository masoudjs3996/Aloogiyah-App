using AlooGiyah_Application.DTOs.Farm;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Query;

public interface IFarmQuery
{
    Task<PagedResult<FarmListDto>> GetByFilterAsync(FarmFilterDto filter);
}
