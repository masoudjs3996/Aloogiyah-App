using AlooGiyah_Application.DTOs.Farm;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Query;

public interface IFarmQuery
{
    Task<FarmDto?> GetByCodeAsync(string code);
    Task<PagedResult<FarmListDto>> GetByFilterAsync(FarmFilterDto filter);
    Task<PagedResult<MyFarmlistDto>> GetMyFarmsAsync(GetMyFarmDto filter , int currentUserId);
}
