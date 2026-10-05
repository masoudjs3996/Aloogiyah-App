using AlooGiyah_Application.DTOs.Discount;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IDiscountQuery
{
    Task<DiscountDto?> GetByCodeAsync(string code);
    Task<PagedResult<DiscountDto>> GetByFilterAsync(DiscountFilterDto filter);
}
