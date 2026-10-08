using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.ChatMessage;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System.Linq.Expressions;

namespace AlooGiyah_Application.Services;

public class ChatMessageService : IChatMessageService
{
    private readonly IChatMessageQuery _readQuery;

    #region Constructor
    private readonly IGenericRepository<ChatMessage> _chatMessageRepository;
    private readonly IGenericRepository<User> _userRepository;
    private readonly IGenericRepository<ChatConversation> _conversationRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ChatMessageService(IChatMessageQuery readQuery,
        
        IGenericRepository<ChatMessage> chatMessageRepository,
        IGenericRepository<User> userRepository,
        IGenericRepository<ChatConversation> conversationRepository,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _readQuery = readQuery;
        _chatMessageRepository = chatMessageRepository;
        _userRepository = userRepository;
        _conversationRepository = conversationRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion


    #region Create
    public async Task<ChatMessageDto> CreateAsync(ChatMessageCreateDto dto)
    {
        var senderId = CurrentUserId();
        // اعتبارسنجی پیام
        if (string.IsNullOrWhiteSpace(dto.Message))
            throw new InvalidOperationException("پیام نمی‌تواند خالی باشد");

        // گرفتن فرستنده
        var room = await _conversationRepository.GetByCodeAsync(dto.ConversationCode);
        if (room == null || room.IsDeleted)
            throw new NotFoundException("گفت‌وگوی موردنظر پیدا نشد.");

        var receiverId = room.ParticipantOneId == senderId ? room.ParticipantTwoId :
            room.ParticipantTwoId == senderId ? room.ParticipantOneId : 0;
        if (receiverId == 0)
            throw new ForbiddenException("شما عضو این گفت‌وگو نیستید.");

        // جلوگیری از ارسال پیام به خود
        var entity = _mapper.Map<ChatMessage>(dto);
        entity.SenderId = senderId;
        entity.ReceiverId = receiverId;
        entity.ConversationId = room.ChatConversationId;
        entity.IsRead = false;

        await _chatMessageRepository.AddAsync(entity);
        room.LastMessageAt = entity.CreatedAt;
        await _conversationRepository.UpdateAsync(room);
        await _unitOfWork.SaveChangesAsync();

        try
        {
            var enrichedMessage = await _readQuery.GetByCodeAsync(entity.Code);
            if (enrichedMessage != null)
                return enrichedMessage;
        }
        catch
        {
            // Message persistence has already succeeded; keep the send successful if
            // the optional participant-name read is temporarily unavailable.
        }

        var chatMessageDto = _mapper.Map<ChatMessageDto>(entity);
        chatMessageDto.SenderCode = _currentUserService.UserCode ?? string.Empty;
        chatMessageDto.ReceiverCode = await _userRepository.GetCodeByIdAsync(receiverId) ?? string.Empty;
        chatMessageDto.ConversationCode = room.Code;

        return chatMessageDto;
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(ChatMessageUpdateDto dto)
    {
        var actorId = CurrentUserId();
        var entity = await _chatMessageRepository.GetByCodeAsync(dto.Code);
        if (entity == null)
            return false;
        if (entity.SenderId == actorId)
        {
            if (entity.IsRead) throw new ForbiddenException("پیام پس از خوانده‌شدن قابل ویرایش نیست.");
            if (string.IsNullOrWhiteSpace(dto.Message)) throw new BadRequestException("متن پیام نمی‌تواند خالی باشد.");
            entity.Message = dto.Message.Trim();
            entity.IsEdited = true;
            entity.EditedAt = DateTimeOffset.UtcNow;
        }
        else if (entity.ReceiverId == actorId)
        {
            if (dto.IsRead != true) throw new ForbiddenException("گیرنده فقط می‌تواند پیام دریافتی را خوانده‌شده کند.");
            entity.IsRead = true;
        }
        else throw new ForbiddenException("ویرایش این پیام برای شما مجاز نیست.");

        if (entity.SenderId == actorId && dto.IsRead == true)
            throw new ForbiddenException("فرستنده نمی‌تواند وضعیت خوانده‌شدن پیام را تغییر دهد.");

        await _chatMessageRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var actorId = CurrentUserId();
        var entity = await _chatMessageRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        if (entity.SenderId != actorId)
            throw new ForbiddenException("فقط فرستنده می‌تواند پیام خودش را حذف کند.");

        await _chatMessageRepository.LogicalDeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Get By Code
    public async Task<ChatMessageDto?> GetByCodeAsync(string code)
    {
        return await _readQuery.GetByCodeAsync(code);
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<ChatMessageDto>> GetByFilterAsync(ChatMessageFilterDto filter)
    {
        return await _readQuery.GetByFilterAsync(filter);
    }
    #endregion

    #region Get Conversation
    public async Task<PagedResult<ChatMessageDto>> GetConversationAsync(string conversationCode, int pageNumber, int pageSize)
    {
        var currentId = CurrentUserId();
        if (pageNumber < 1 || pageSize < 1 || pageSize > 100) throw new BadRequestException("صفحه‌بندی مکالمه معتبر نیست.");
        var room = await _conversationRepository.GetByCodeAsync(conversationCode);
        if (room == null || (room.ParticipantOneId != currentId && room.ParticipantTwoId != currentId))
            throw new ForbiddenException("این گفت‌وگو در دسترس شما نیست.");
        return await _readQuery.GetConversationAsync(conversationCode, pageNumber, pageSize);
    }

    public async Task<ChatConversationDto> GetOrCreateConversationAsync(string receiverCode)
    {
        var currentId = CurrentUserId();
        if (await _readQuery.GetContactAsync(receiverCode) == null)
            throw new NotFoundException("مخاطب گفت‌وگو پیدا نشد یا اجازهٔ دریافت پیام ندارد.");
        var receiverId = await _userRepository.GetIdByCodeAsync(receiverCode, user => user.UserId);
        if (receiverId == null || receiverId == currentId)
            throw new NotFoundException("مخاطب گفت‌وگو پیدا نشد.");

        var one = Math.Min(currentId, receiverId.Value);
        var two = Math.Max(currentId, receiverId.Value);
        var room = await _conversationRepository.FirstOrDefaultAsync(item =>
            item.ParticipantOneId == one && item.ParticipantTwoId == two);
        if (room == null)
        {
            room = new ChatConversation { ParticipantOneId = one, ParticipantTwoId = two };
            await _conversationRepository.AddAsync(room);
            try
            {
                await _unitOfWork.SaveChangesAsync();
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                // Another request may have opened the same pair at the same time.
                var existingRoom = await _conversationRepository.FirstOrDefaultAsync(item =>
                    item.ParticipantOneId == one && item.ParticipantTwoId == two)
                    ;
                if (existingRoom == null) throw;
                room = existingRoom;
            }
        }
        return await GetConversationInfoAsync(room.Code) ?? throw new NotFoundException("گفت‌وگو پیدا نشد.");
    }

    public async Task<ChatConversationDto?> GetConversationInfoAsync(string conversationCode)
    {
        var currentId = CurrentUserId();
        var room = await _conversationRepository.GetByCodeAsync(conversationCode);
        if (room == null || (room.ParticipantOneId != currentId && room.ParticipantTwoId != currentId)) return null;
        var peerId = room.ParticipantOneId == currentId ? room.ParticipantTwoId : room.ParticipantOneId;
        var peerCode = await _userRepository.GetCodeByIdAsync(peerId);
        if (peerCode == null) return null;
        var contact = await GetContactAsync(peerCode);
        if (contact == null) return null;
        return new ChatConversationDto { Code = room.Code, PeerCode = peerCode, PeerName = contact.DisplayName, FarmName = contact.FarmName, ProductName = contact.ProductName };
    }

    public async Task<ChatContactDto?> GetContactAsync(string code)
    {
        CurrentUserId();
        return await _readQuery.GetContactAsync(code);
    }

    public async Task<List<ChatConversationSummaryDto>> GetConversationsAsync()
    {
        CurrentUserId();
        return await _readQuery.GetConversationsAsync();
    }

    private int CurrentUserId()
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.IsGuest || !int.TryParse(_currentUserService.UserId, out var id))
            throw new AlooGiyah_Shared.Exceptions.UnauthorizedException("ابتدا وارد حساب کاربری شوید.");
        return id;
    }
    #endregion
}
