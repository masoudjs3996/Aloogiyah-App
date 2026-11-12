using AlooGiyah_Application.DTOs.ChatMessage;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service;

public interface IChatMessageService
{
    Task<ChatMessageDto> ForwardAsync(string code, string conversationCode);
    Task<(ChatMessageDto Message, bool Created)> CreateFileAsync(string conversationCode,
        Microsoft.AspNetCore.Http.IFormFile file, AlooGiyah_Domain.Interfaces.IChatFileStorage storage,
        string? preview, Guid? uploadRequestId, string? caption, Guid? attachmentGroupId,
        int? attachmentGroupPosition, CancellationToken cancellationToken);
    Task<AlooGiyah_Domain.ValueObjects.ChatStoredFile> GetFileAsync(string code);
    Task<ChatMessageDto> CreateAsync(ChatMessageCreateDto dto);
    Task<bool> UpdateAsync(ChatMessageUpdateDto dto);
    Task<bool> DeleteAsync(string code);
    Task<List<ChatMessageDto>> DeleteManyAsync(string[] codes);
    Task<ChatMessageDto?> GetByCodeAsync(string code);
    Task<PagedResult<ChatMessageDto>> GetByFilterAsync(ChatMessageFilterDto filter);
    Task<PagedResult<ChatMessageDto>> GetConversationAsync(string conversationCode, int pageNumber, int pageSize);
    Task<ChatConversationDto> PrepareConversationAsync(string receiverCode);
    Task<ChatConversationDto?> GetConversationInfoAsync(string conversationCode);
    Task<string> SetConversationBlockedAsync(string conversationCode, bool blocked);
    Task<ChatContactDto?> GetContactAsync(string code);
    Task<List<ChatConversationSummaryDto>> GetConversationsAsync();
}
