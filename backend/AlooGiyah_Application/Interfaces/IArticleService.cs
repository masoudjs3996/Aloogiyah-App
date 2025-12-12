using AlooGiyah_Application.DTOs.Article;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces
{
    public interface IArticleService
    {
        Task<PagedResult<ArticleListDto>> GetByFilterAsync(ArticleFilterDto dto);
        Task<ArticleDto?> GetByCodeAsync(string code);
        Task<ArticleDto> CreateAsync(ArticleCreateDto dto);
        Task<bool> UpdateAsync(ArticleUpdateDto dto);
        Task<bool> DeleteAsync(string code);
    }
}
