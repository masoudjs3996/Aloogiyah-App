using AlooGiyah_Application.DTOs.OrderItem;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IOrderItemQuery
{
    Task<OrderItemDto?> GetByCodeAsync(string code);
    Task<PagedResult<OrderItemDto>> GetByFilterAsync(OrderItemFilterDto filter);
}
