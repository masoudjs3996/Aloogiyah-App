using AlooGiyah_Application.DTOs.Product;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Store;

public interface IProductService
{
    Task<ProductDto> CreateAsync(ProductCreateDto dto);
    Task<bool> UpdateAsync(ProductUpdateDto dto);
    Task<bool> DeleteAsync(string code);
    Task<ProductDto?> GetByCodeAsync(string code);
    Task<PagedResult<ProductDto>> GetByFilterAsync(ProductFilterDto filter);
}
