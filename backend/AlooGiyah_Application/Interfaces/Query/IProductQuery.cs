using AlooGiyah_Application.DTOs.Product;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IProductQuery
{
    Task<ProductDto?> GetByCodeAsync(string code);
    Task<PagedResult<ProductDto>> GetByFilterAsync(ProductFilterDto filter);
}
