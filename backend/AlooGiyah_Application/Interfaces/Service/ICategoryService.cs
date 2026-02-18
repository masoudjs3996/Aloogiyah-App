using AlooGiyah_Application.DTOs.Category;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Pagination;
using Microsoft.AspNetCore.Http;

namespace AlooGiyah_Application.Interfaces.Service;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetCategoryTreeAsync();
    Task<List<CategoryDto>> GetCategoriesByTypeAsync(CategoryFetchType type);
    Task<PagedResult<CategoryListDto>> GetFilteredAsync(CategoryFilterDto filter);
    Task<CategoryDto> GetByCodeAsync(string code);
    Task<CategoryDto> CreateAsync(CategoryCreateDto dto);
    Task<string?> ChangeCategoryImageAsync(UploadCategoryImageDto dto);
    Task<CategoryDto> UpdateAsync(CategoryUpdateDto dto);
    Task<bool> LogicalDeleteAsync(string code);
}
