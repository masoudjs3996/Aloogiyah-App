using AlooGiyah_Application.DTOs.Farm;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Store;

public interface IFarmService
{
    Task<FarmDto> CreateWithImageAsync(FarmCreateDto dto);
    Task<FarmDto?> UpdateAsync(FarmUpdateDto dto);
    Task<bool> DeleteAsync(string code);
    Task<FarmDto?> GetByCodeAsync(string code);
    Task<PagedResult<MyFarmlistDto>> GetMyFarmsAsync(GetMyFarmDto filter);
    Task<PagedResult<FarmDto>> GetByFilterAsync(FarmFilterDto filter);
    Task<string> ChangeFarmImageAsync(UploadFarmImageDto upload);    
}
