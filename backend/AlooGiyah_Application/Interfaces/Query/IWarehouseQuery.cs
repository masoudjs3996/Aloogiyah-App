using AlooGiyah_Application.DTOs.Warehouse;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IWarehouseQuery
{
    Task<WarehouseDto?> GetByCodeAsync(string code);
    Task<PagedResult<WarehouseDto>> GetByFilterAsync(WarehouseFilterDto filter);
}
