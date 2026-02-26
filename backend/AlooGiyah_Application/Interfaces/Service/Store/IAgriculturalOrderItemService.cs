using AlooGiyah_Application.DTOs.AgriculturalOrderItem;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service.Store;

public interface IAgriculturalOrderItemService
{
    Task<AgriculturalOrderItemDto> CreateAsync(AgriculturalOrderItemCreateDto dto, string orderCode);
    Task<bool> UpdateAsync(AgriculturalOrderItemUpdateDto dto);
    Task<bool> DeleteAsync(string code);
    Task<AgriculturalOrderItemDto?> GetByCodeAsync(string code);
    Task<PagedResult<AgriculturalOrderItemDto>> GetByFilterAsync(AgriculturalOrderItemFilterDto filter);
}
