using AlooGiyah_Application.DTOs.Warehouse;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service;

public interface IWarehouseService
{
    Task<WarehouseDto> CreateAsync(WarehouseCreateDto dto);
    Task<bool> UpdateAsync(WarehouseUpdateDto dto);
    Task<bool> DeleteAsync(string code);
    Task<WarehouseDto?> GetByCodeAsync(string code);
    Task<PagedResult<WarehouseDto>> GetByFilterAsync(WarehouseFilterDto filter);
}
