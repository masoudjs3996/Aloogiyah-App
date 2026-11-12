using AlooGiyah_Domain.Enums;
using AlooGiyah_Application.DTOs.Category;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface ICategoryQuery
{
    Task<CategoryDto?> GetByCodeAsync(string code);
    Task<List<CategoryDto>> GetCategoryTreeAsync();
    Task<List<CategoryDto>> GetCategoriesByTypeAsync(CategoryFetchType type);
    Task<PagedResult<CategoryListDto>> GetFilteredAsync(CategoryFilterDto filter);
}
