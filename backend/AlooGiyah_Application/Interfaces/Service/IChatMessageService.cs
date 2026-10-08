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
    Task<PagedResult<ChatMessageDto>> GetConversationAsync(string conversationCode, int pageNumber, int pageSize);
    Task<ChatConversationDto> GetOrCreateConversationAsync(string receiverCode);
    Task<ChatConversationDto?> GetConversationInfoAsync(string conversationCode);
    Task<ChatContactDto?> GetContactAsync(string code);
    Task<List<ChatConversationSummaryDto>> GetConversationsAsync();
}
