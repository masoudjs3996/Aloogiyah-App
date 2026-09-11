using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Query;

public interface IAgriculturalProductQuery
{
    Task<AgriculturalProductDetailDto?> GetByCodeAsync(string code, string role);

    Task<PagedResult<AgriculturalProductListItemDto>> GetByFilterAsync(AgriculturalProductFilterDto filter,string role);

    Task<PagedResult<AgriculturalProductSimilarDto>> GetSimilarAsync(AgriculturalProductSimilarFilterDto filter);
}