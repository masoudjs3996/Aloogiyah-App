using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Store;

public interface IAgriculturalProductService
{
    Task<AgriculturalProductDto> CreateAsync(AgriculturalProductCreateDto dto);
    Task<AgriculturalProductDetailDto> CreateWithImagesAsync(AgriculturalProductCreateDto dto);
    Task<bool> UpdateAsync(AgriculturalProductUpdateDto dto);
    Task<bool> DeleteAsync(string code);
    Task<AgriculturalProductDetailDto?> GetByCodeAsync(string code);
    Task<PagedResult<AgriculturalProductListItemDto>> GetByFilterAsync(AgriculturalProductFilterDto filter);
    Task<List<string>> AddProductImagesAsync(AddProductImagesDto dto);
    Task<string> SetPrimaryProductImageAsync(string productCode, string fileCode);
    Task RemoveProductImageAsync(string productCode, string fileCode);
}