using AlooGiyah_Application.DTOs.AgriculturalOrderItem;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IAgriculturalOrderItemQuery
{
    Task<AgriculturalOrderItemDto?> GetByCodeAsync(string code);
    Task<PagedResult<AgriculturalOrderItemDto>> GetByFilterAsync(AgriculturalOrderItemFilterDto filter);
}
