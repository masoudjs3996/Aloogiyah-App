using AlooGiyah_Application.DTOs.ChatMessage;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IChatMessageQuery
{
    Task<ChatMessageDto?> GetByCodeAsync(string code);
    Task<PagedResult<ChatMessageDto>> GetByFilterAsync(ChatMessageFilterDto filter);
    Task<PagedResult<ChatMessageDto>> GetConversationAsync(string conversationCode, int pageNumber, int pageSize);
    Task<ChatContactDto?> GetContactAsync(string code);
    Task<List<ChatConversationSummaryDto>> GetConversationsAsync();
}
