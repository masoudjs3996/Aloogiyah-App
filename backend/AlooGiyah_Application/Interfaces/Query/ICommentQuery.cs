using AlooGiyah_Application.DTOs.Comment;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface ICommentQuery
{
    Task<CommentDto?> GetByCodeAsync(string code);
    Task<PagedResult<CommentDto>> GetByFilterAsync(CommentFilterDto filter);
    Task<List<CommentDto>> GetTreeCommentsAsync(CommentTreeFilterDto filter);
}
