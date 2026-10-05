using AlooGiyah_Application.DTOs.Article;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IArticleQuery
{
    Task<ArticleDto?> GetByCodeAsync(string code);
    Task<PagedResult<ArticleListDto>> GetByFilterAsync(ArticleFilterDto filter);
}
