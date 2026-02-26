using AlooGiyah_Application.DTOs.ChatMessage;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service;

public interface IChatMessageService
{
    Task<ChatMessageDto> CreateAsync(ChatMessageCreateDto dto);
    Task<bool> UpdateAsync(ChatMessageUpdateDto dto);
    Task<bool> DeleteAsync(string code);
    Task<ChatMessageDto?> GetByCodeAsync(string code);
    Task<PagedResult<ChatMessageDto>> GetByFilterAsync(ChatMessageFilterDto filter);
    Task<PagedResult<ChatMessageDto>> GetConversationAsync(string userCode1, string userCode2, int pageNumber, int pageSize);
}