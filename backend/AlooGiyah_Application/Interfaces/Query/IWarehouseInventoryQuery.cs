using AlooGiyah_Application.DTOs.WarehouseInventory;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IWarehouseInventoryQuery
{
    Task<WarehouseInventoryDto?> GetByCodeAsync(string code);
    Task<PagedResult<WarehouseInventoryDto>> GetByFilterAsync(WarehouseInventoryFilterDto filter);
}
