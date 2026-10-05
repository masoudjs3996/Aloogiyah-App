using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IAgriculturalOrderQuery
{
    Task<AgriculturalOrderDto?> GetByCodeAsync(string code);
    Task<PagedResult<AgriculturalOrderDto>> GetByFilterAsync(AgriculturalOrderFilterDto filter);
}
