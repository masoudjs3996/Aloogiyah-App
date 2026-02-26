using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AlooGiyah_Application.DTOs.Order;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service.Store
{
    public interface IOrderService
    {
        Task<OrderDto> CreateAsync(OrderCreateDto dto);
        Task<PagedResult<OrderDto>> GetByFilterAsync(OrderFilterDto dto);
        Task<OrderDto?> GetByCodeAsync(string orderCode);
        Task<bool> UpdateAsync(OrderUpdateDto dto);
        Task<bool> ApproveOrderAsync(ApproveOrderDto orderDto);
    }
}
