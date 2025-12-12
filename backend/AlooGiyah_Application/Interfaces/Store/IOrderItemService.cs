using AlooGiyah_Application.DTOs.OrderItem;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Store;

public interface IOrderItemService
{
    Task<PagedResult<OrderItemDto>> GetByFilterAsync(OrderItemFilterDto dto);
    Task<OrderItemDto?> GetByCodeAsync(string orderItemCode);
    Task<OrderItemDto> CreateAsync(OrderItemCreateDto dto);
    Task<bool> UpdateAsync(OrderItemUpdateDto dto);
    Task<bool> DeleteAsync(int orderItemId);
}
