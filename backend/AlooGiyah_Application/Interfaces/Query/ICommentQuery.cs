using AlooGiyah_Application.DTOs.Comment;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface ICommentQuery
{
    Task<CommentDto?> GetByCodeAsync(string code);
    Task<PagedResult<CommentDto>> GetByFilterAsync(CommentFilterDto filter);
    Task<List<CommentDto>> GetTreeCommentsAsync(CommentTreeFilterDto filter);
    Task<CommentRatingSummaryDto> GetRatingSummaryAsync(string entityCode, AlooGiyah_Domain.Enums.EntityComment entityComment);
    Task<CommentDto?> GetMyProductReviewAsync(string entityCode, AlooGiyah_Domain.Enums.EntityComment entityComment, int userId);
}
