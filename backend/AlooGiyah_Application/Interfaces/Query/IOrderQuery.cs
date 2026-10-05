using AlooGiyah_Application.DTOs.Order;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IOrderQuery
{
    Task<OrderDto?> GetByCodeAsync(string code);
    Task<PagedResult<OrderDto>> GetByFilterAsync(OrderFilterDto filter);
}
