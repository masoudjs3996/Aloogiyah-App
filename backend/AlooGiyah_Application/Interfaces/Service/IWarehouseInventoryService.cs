using AlooGiyah_Application.DTOs.WarehouseInventory;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service
{
    public interface IWarehouseInventoryService
    {
        Task<WarehouseInventoryDto> CreateAsync(WarehouseInventoryCreateDto dto);
        Task<bool> UpdateAsync(WarehouseInventoryUpdateDto dto);
        Task<bool> DeleteAsync(string code);
        Task<WarehouseInventoryDto?> GetByCodeAsync(string code);
        Task<PagedResult<WarehouseInventoryDto>> GetByFilterAsync(WarehouseInventoryFilterDto filter);
    }
}
