using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Store;

public interface IAgriculturalProductService
{
    Task<AgriculturalProductDto> CreateAsync(AgriculturalProductCreateDto dto);
    Task<bool> UpdateAsync(AgriculturalProductUpdateDto dto);
    Task<bool> DeleteAsync(string code);
    Task<AgriculturalProductDto?> GetByCodeAsync(string code);
    Task<PagedResult<AgriculturalProductDto>> GetByFilterAsync(AgriculturalProductFilterDto filter);
}