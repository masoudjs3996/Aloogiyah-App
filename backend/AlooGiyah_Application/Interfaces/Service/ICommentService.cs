using AlooGiyah_Application.DTOs.Comment;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service
{
    public interface ICommentService
    {
        Task<CommentDto> CreateAsync(CommentCreateDto dto);
        Task<bool> UpdateAsync(CommentUpdateDto dto);
        Task<bool> DeleteAsync(string code);
        Task<CommentDto?> GetByCodeAsync(string code);
        Task<PagedResult<CommentDto>> GetByFilterAsync(CommentFilterDto filter);
    }
}
