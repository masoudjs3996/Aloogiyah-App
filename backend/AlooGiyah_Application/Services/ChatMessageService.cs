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
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Application.Services;

public class ChatMessageService : IChatMessageService
{
    private const string DraftPrefix = "draft-";
    private readonly IChatMessageQuery _readQuery;

    #region Constructor
    private readonly IGenericRepository<ChatMessage> _chatMessageRepository;
    private readonly IGenericRepository<User> _userRepository;
    private readonly IGenericRepository<ChatConversation> _conversationRepository;
    private readonly IGenericRepository<ChatConversationBlock> _blocks;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ContentModeration _moderation;

    public ChatMessageService(IChatMessageQuery readQuery,
        
        IGenericRepository<ChatMessage> chatMessageRepository,
        IGenericRepository<User> userRepository,
        IGenericRepository<ChatConversation> conversationRepository,
        IGenericRepository<ChatConversationBlock> blocks,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ContentModeration moderation)
    {
        _readQuery = readQuery;
        _chatMessageRepository = chatMessageRepository;
        _userRepository = userRepository;
        _conversationRepository = conversationRepository;
        _blocks = blocks;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _moderation = moderation;
    }
    #endregion


    #region Create
    public Task<ChatMessageDto> CreateAsync(ChatMessageCreateDto dto) => CreateCoreAsync(dto, null);

    public async Task<(ChatMessageDto Message, bool Created)> CreateFileAsync(string conversationCode,
        Microsoft.AspNetCore.Http.IFormFile file, IChatFileStorage storage, string? preview,
        Guid? uploadRequestId, string? caption, Guid? attachmentGroupId,
        int? attachmentGroupPosition, CancellationToken cancellationToken)
    {
        if (attachmentGroupId == Guid.Empty || (attachmentGroupId.HasValue != attachmentGroupPosition.HasValue) ||
            attachmentGroupPosition is < 0 or >= 5)
            throw new BadRequestException("گروه فایل‌های پیوست نامعتبر است.");

        var messageText = string.IsNullOrWhiteSpace(caption) ? "فایل پیوست" : caption.Trim();
        if (messageText.Length > 4000)
            throw new BadRequestException("متن پیوست حداکثر می‌تواند ۴۰۰۰ نویسه باشد.");
        var conversation = await GetConversationInfoAsync(conversationCode);
        if (conversation == null || conversation.IsBlocked) throw new ForbiddenException("ارسال فایل در این گفت‌وگو امکان‌پذیر نیست.");
        var senderId = CurrentUserId();
        if (uploadRequestId is Guid requestId &&
            await FindUploadedMessageAsync(senderId, conversation.PeerCode, requestId, cancellationToken) is { } previous)
            return (previous, false);

        var saved = await storage.SaveAsync(file, cancellationToken);
        try
        {
            var thumbnail = ChatMediaPreview.Validate(preview, saved.ContentType);
            var message = await CreateCoreAsync(new ChatMessageCreateDto { ConversationCode = conversationCode, Message = messageText },
                saved, thumbnail, uploadRequestId, cancellationToken, attachmentGroupId, attachmentGroupPosition);
            return (message, true);
        }
        catch (Exception error)
        {
            storage.Delete(saved.Key);
            if (error is DbUpdateException && uploadRequestId is Guid duplicateId &&
                await FindUploadedMessageAsync(senderId, conversation.PeerCode, duplicateId, cancellationToken) is { } duplicate)
                return (duplicate, false);
            throw;
        }
    }

    private async Task<ChatMessageDto?> FindUploadedMessageAsync(int senderId, string peerCode, Guid requestId, CancellationToken ct)
    {
        var existing = await _chatMessageRepository.GetAllIncludingDeleted().AsNoTracking()
            .Where(message => message.SenderId == senderId && message.UploadRequestId == requestId)
            .Select(message => new { message.Code, message.IsDeleted, PeerCode = message.Receiver.Code })
            .SingleOrDefaultAsync(ct);
        if (existing is null) return null;
        if (existing.IsDeleted || existing.PeerCode != peerCode)
            throw new ConflictException("این شناسهٔ ارسال قبلاً استفاده شده است.");
        return await _readQuery.GetByCodeAsync(existing.Code)
            ?? throw new ConflictException("این فایل قبلاً ارسال شده است.");
    }

    public async Task<AlooGiyah_Domain.ValueObjects.ChatStoredFile> GetFileAsync(string code)
    {
        var actor = CurrentUserId();
        var entity = await _chatMessageRepository.GetByCodeAsync(code);
        if (entity == null || entity.IsDeleted || entity.AttachmentKey == null) throw new NotFoundException("فایل پیدا نشد.");
        if (entity.SenderId != actor && entity.ReceiverId != actor) throw new ForbiddenException("این فایل در دسترس شما نیست.");
        return new(entity.AttachmentKey, entity.AttachmentName!, entity.AttachmentType!, entity.AttachmentSize!.Value);
    }

    private async Task<ChatMessageDto> CreateCoreAsync(ChatMessageCreateDto dto, AlooGiyah_Domain.ValueObjects.ChatStoredFile? attachment,
        string? preview = null, Guid? uploadRequestId = null, CancellationToken cancellationToken = default,
        Guid? attachmentGroupId = null, int? attachmentGroupPosition = null)
    {
        var senderId = CurrentUserId();
        // اعتبارسنجی پیام
        if (string.IsNullOrWhiteSpace(dto.Message))
            throw new InvalidOperationException("پیام نمی‌تواند خالی باشد");
        _moderation.Validate(dto.Message, attachment?.Name);

        var room = await ResolveRoomAsync(dto.ConversationCode, senderId, createForSend: true);
        if (room == null || room.IsDeleted)
            throw new NotFoundException("گفت‌وگوی موردنظر پیدا نشد.");

        var receiverId = room.ParticipantOneId == senderId ? room.ParticipantTwoId :
            room.ParticipantTwoId == senderId ? room.ParticipantOneId : 0;
        if (receiverId == 0)
            throw new ForbiddenException("شما عضو این گفت‌وگو نیستید.");
        var receiverCode = await _userRepository.GetAll().Where(x => x.UserId == receiverId)
            .Select(x => x.Code).SingleOrDefaultAsync();
        if (receiverCode is null)
            throw new ForbiddenException("این حساب دیگر در دسترس نیست.");

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        if (room.ChatConversationId != 0) await EnsureRoomWritableAsync(room.ChatConversationId);

        // جلوگیری از ارسال پیام به خود
        var entity = _mapper.Map<ChatMessage>(dto);
        entity.UploadRequestId = uploadRequestId;
        entity.AttachmentGroupId = attachmentGroupId;
        entity.AttachmentGroupPosition = attachmentGroupPosition;
        entity.AttachmentKey = attachment?.Key;
        entity.AttachmentName = attachment?.Name;
        entity.AttachmentType = attachment?.ContentType;
        entity.AttachmentSize = attachment?.Size;
        entity.AttachmentPreview = preview;
        entity.SenderId = senderId;
        if (attachmentGroupId.HasValue && room.ChatConversationId != 0)
            await ApplyExistingAttachmentCaptionAsync(entity, room.ChatConversationId, cancellationToken);
        entity.ReceiverId = receiverId;
        entity.Conversation = room;
        entity.IsRead = false;

        room.LastMessageAt = entity.CreatedAt;
        if (room.ChatConversationId == 0)
            await _conversationRepository.AddAsync(room);
        else
            await _conversationRepository.UpdateAsync(room);
        await _chatMessageRepository.AddAsync(entity);
        cancellationToken.ThrowIfCancellationRequested();
        try
        {
            await _unitOfWork.SaveChangesAsync();
        }
        catch (DbUpdateException error) when (room.ChatConversationId == 0)
        {
            // A simultaneous first send may have committed the unique participant pair.
            var failedRoom = error.Entries.FirstOrDefault(entry => ReferenceEquals(entry.Entity, room));
            if (failedRoom == null) throw;
            var existingRoom = await FindRoomAsync(room.ParticipantOneId, room.ParticipantTwoId);
            if (existingRoom == null) throw;

            failedRoom.Context.Entry(entity).State = EntityState.Detached;
            failedRoom.State = EntityState.Detached;
            room = existingRoom;
            await EnsureRoomWritableAsync(room.ChatConversationId);
            entity.Conversation = room;
            entity.ConversationId = room.ChatConversationId;
            if (attachmentGroupId.HasValue)
                await ApplyExistingAttachmentCaptionAsync(entity, room.ChatConversationId, cancellationToken);
            room.LastMessageAt = entity.CreatedAt;
            await _conversationRepository.UpdateAsync(room);
            await _chatMessageRepository.AddAsync(entity);
            await _unitOfWork.SaveChangesAsync();
        }
        cancellationToken.ThrowIfCancellationRequested();
        await transaction.CommitAsync();

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
        chatMessageDto.ReceiverCode = receiverCode;
        chatMessageDto.ConversationCode = room.Code;

        return chatMessageDto;
    }
    #endregion

    private async Task ApplyExistingAttachmentCaptionAsync(ChatMessage message, int roomId, CancellationToken ct)
    {
        var existing = await _chatMessageRepository.GetAll()
            .Where(x => x.ConversationId == roomId && x.SenderId == message.SenderId &&
                x.AttachmentGroupId == message.AttachmentGroupId && !x.IsDeleted)
            .OrderBy(x => x.AttachmentGroupPosition)
            .Select(x => new { x.Message, x.IsEdited, x.EditedAt })
            .FirstOrDefaultAsync(ct);
        if (existing is null) return;
        message.Message = existing.Message;
        message.IsEdited = existing.IsEdited;
        message.EditedAt = existing.EditedAt;
    }

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
            _moderation.Validate(dto.Message);
            if (dto.IsRead == true) throw new ForbiddenException("فرستنده نمی‌تواند وضعیت خوانده‌شدن پیام را تغییر دهد.");
            await using var transaction = await _unitOfWork.BeginTransactionAsync();
            await EnsureRoomWritableAsync(entity.ConversationId);
            var messages = _chatMessageRepository.GetAll().Where(x => x.SenderId == actorId && !x.IsDeleted);
            var target = entity.AttachmentGroupId.HasValue
                ? messages.Where(x => x.ConversationId == entity.ConversationId && x.AttachmentGroupId == entity.AttachmentGroupId)
                : messages.Where(x => x.Code == dto.Code);
            var changed = await target.Where(_ => !target.Any(x => x.IsRead))
                .ExecuteUpdateAsync(set => set.SetProperty(x => x.Message, dto.Message.Trim())
                    .SetProperty(x => x.IsEdited, true).SetProperty(x => x.EditedAt, DateTimeOffset.UtcNow));
            if (changed == 0) throw new ForbiddenException("پیام پس از خوانده‌شدن قابل ویرایش نیست.");
            await transaction.CommitAsync();
            return true;
        }
        else if (entity.ReceiverId == actorId)
        {
            if (dto.IsRead != true) throw new ForbiddenException("گیرنده فقط می‌تواند پیام دریافتی را خوانده‌شده کند.");
            await _chatMessageRepository.GetAll().Where(x => x.Code == dto.Code && x.ReceiverId == actorId)
                .ExecuteUpdateAsync(set => set.SetProperty(x => x.IsRead, true));
            return true;
        }
        else throw new ForbiddenException("ویرایش این پیام برای شما مجاز نیست.");

    }
    #endregion

    #region Delete
    public async Task<List<ChatMessageDto>> DeleteManyAsync(string[] codes)
    {
        if (codes == null || codes.Length is < 1 or > 100 || codes.Any(code => string.IsNullOrWhiteSpace(code) || code.Length > 10))
            throw new BadRequestException("بین ۱ تا ۱۰۰ پیام معتبر انتخاب کنید.");
        var selected = codes.Distinct(StringComparer.Ordinal).ToArray();
        var actor = CurrentUserId();
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        var messages = await _chatMessageRepository.GetAll()
            .Where(x => selected.Contains(x.Code) && x.SenderId == actor && !x.IsRead && !x.IsDeleted)
            .Select(x => new ChatMessageDto { Code = x.Code, ConversationCode = x.Conversation.Code,
                SenderCode = x.Sender.Code, ReceiverCode = x.Receiver.Code, Message = x.Message,
                CreatedAt = x.CreatedAt, IsDeleted = true }).ToListAsync();
        if (messages.Count != selected.Length)
            throw new ForbiddenException("حذف گروهی فقط برای پیام‌های ارسال‌شده توسط شما که هنوز خوانده نشده‌اند مجاز است.");
        // Recheck eligibility in the write: if any message was just read, roll back the whole batch.
        var deleted = await _chatMessageRepository.GetAll()
            .Where(x => selected.Contains(x.Code) && x.SenderId == actor && !x.IsRead && !x.IsDeleted)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.IsDeleted, true).SetProperty(x => x.UpdatedAt, DateTimeOffset.UtcNow));
        if (deleted != selected.Length)
            throw new ForbiddenException("وضعیت بعضی پیام‌ها تغییر کرد؛ هیچ پیامی حذف نشد. دوباره انتخاب کنید.");
        await transaction.CommitAsync();
        return messages;
    }

    public async Task<bool> DeleteAsync(string code)
    {
        var actorId = CurrentUserId();
        var entity = await _chatMessageRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        if (entity.SenderId != actorId)
            throw new ForbiddenException("فقط فرستنده می‌تواند پیام خودش را حذف کند.");

        var deleted = await _chatMessageRepository.GetAll().Where(x => x.Code == code && x.SenderId == actorId && !x.IsRead)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.IsDeleted, true).SetProperty(x => x.UpdatedAt, DateTimeOffset.UtcNow));
        if (deleted == 0) throw new ForbiddenException("پیام پس از خوانده‌شدن قابل حذف نیست.");
        return true;
    }
    #endregion

    public async Task<ChatMessageDto> ForwardAsync(string code, string conversationCode)
    {
        var actor = CurrentUserId();
        var source = await _chatMessageRepository.GetByCodeAsync(code);
        if (source == null || source.IsDeleted) throw new NotFoundException("پیام یافت نشد.");
        if (source.SenderId != actor && source.ReceiverId != actor) throw new ForbiddenException("این پیام در دسترس شما نیست.");
        var attachment = source.AttachmentKey == null ? null :
            new AlooGiyah_Domain.ValueObjects.ChatStoredFile(source.AttachmentKey, source.AttachmentName!, source.AttachmentType!, source.AttachmentSize!.Value);
        return await CreateCoreAsync(new ChatMessageCreateDto { ConversationCode = conversationCode, Message = source.Message }, attachment, source.AttachmentPreview);
    }

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
        var room = await ResolveRoomAsync(conversationCode, currentId);
        if (room == null && conversationCode.StartsWith(DraftPrefix, StringComparison.Ordinal))
            return new PagedResult<ChatMessageDto> { PageNumber = pageNumber, PageSize = pageSize };
        if (room == null || (room.ParticipantOneId != currentId && room.ParticipantTwoId != currentId))
            throw new ForbiddenException("این گفت‌وگو در دسترس شما نیست.");
        return await _readQuery.GetConversationAsync(room.Code, pageNumber, pageSize);
    }

    public async Task<ChatConversationDto> PrepareConversationAsync(string receiverCode)
    {
        var currentId = CurrentUserId();
        if (string.Equals(receiverCode, _currentUserService.UserCode, StringComparison.Ordinal))
            throw new BadRequestException("این مزرعه یا محصول متعلق به حساب خودتان است؛ گفت‌وگو با خودتان امکان‌پذیر نیست.");
        var contact = await _readQuery.GetContactAsync(receiverCode)
            ?? throw new NotFoundException("مخاطب گفت‌وگو پیدا نشد یا اجازهٔ دریافت پیام ندارد.");
        var (one, two) = await GetParticipantPairAsync(currentId, receiverCode);
        var room = await FindRoomAsync(one, two);
        return await DescribeConversationAsync(room?.Code ?? DraftPrefix + receiverCode, contact, room, currentId);
    }

    private async Task<(int One, int Two)> GetParticipantPairAsync(int currentId, string receiverCode)
    {
        var receiverId = await _userRepository.GetIdByCodeAsync(receiverCode, user => user.UserId);
        if (receiverId == null || receiverId == currentId)
            throw new NotFoundException("مخاطب گفت‌وگو پیدا نشد.");
        return (Math.Min(currentId, receiverId.Value), Math.Max(currentId, receiverId.Value));
    }

    private Task<ChatConversation?> FindRoomAsync(int one, int two) =>
        _conversationRepository.FirstOrDefaultAsync(room =>
            room.ParticipantOneId == one && room.ParticipantTwoId == two);

    private async Task<ChatConversation?> ResolveRoomAsync(string code, int currentId, bool createForSend = false)
    {
        if (!code.StartsWith(DraftPrefix, StringComparison.Ordinal))
            return await _conversationRepository.GetByCodeAsync(code);

        var receiverCode = code[DraftPrefix.Length..];
        if (await _readQuery.GetContactAsync(receiverCode) == null)
            throw new NotFoundException("مخاطب گفت‌وگو پیدا نشد یا اجازهٔ دریافت پیام ندارد.");
        var (one, two) = await GetParticipantPairAsync(currentId, receiverCode);
        var room = await FindRoomAsync(one, two);
        return room ?? (createForSend ? new ChatConversation { ParticipantOneId = one, ParticipantTwoId = two } : null);
    }

    public async Task<ChatConversationDto?> GetConversationInfoAsync(string conversationCode)
    {
        var currentId = CurrentUserId();
        if (conversationCode.StartsWith(DraftPrefix, StringComparison.Ordinal))
            return await PrepareConversationAsync(conversationCode[DraftPrefix.Length..]);

        var room = await _conversationRepository.GetByCodeAsync(conversationCode);
        if (room == null || (room.ParticipantOneId != currentId && room.ParticipantTwoId != currentId)) return null;
        var peerId = room.ParticipantOneId == currentId ? room.ParticipantTwoId : room.ParticipantOneId;
        var peerCode = await _userRepository.GetCodeByIdAsync(peerId);
        if (peerCode == null) return null;
        var contact = await GetContactAsync(peerCode);
        return contact == null ? null : await DescribeConversationAsync(room.Code, contact, room, currentId);
    }

    private async Task<ChatConversationDto> DescribeConversationAsync(string code, ChatContactDto contact, ChatConversation? room, int actorId)
    {
        var blockers = room is null ? [] : await ActiveBlocks(room.ChatConversationId)
            .Select(x => x.BlockedByUserId).ToArrayAsync();
        return new() { Code = code, PeerCode = contact.Code, PeerName = contact.DisplayName,
            FarmName = contact.FarmName, ProductName = contact.ProductName,
            IsBlocked = blockers.Length > 0, BlockedByMe = blockers.Contains(actorId) };
    }

    public async Task<string> SetConversationBlockedAsync(string conversationCode, bool blocked)
    {
        var actorId = CurrentUserId();
        var room = await ResolveRoomAsync(conversationCode, actorId, createForSend: blocked);
        if (room is null || room.IsDeleted || (room.ParticipantOneId != actorId && room.ParticipantTwoId != actorId))
            throw new NotFoundException("گفت‌وگو پیدا نشد.");

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        if (room.ChatConversationId == 0)
        {
            await _conversationRepository.AddAsync(room);
            try { await _unitOfWork.SaveChangesAsync(); }
            catch (DbUpdateException error)
            {
                var failed = error.Entries.FirstOrDefault(entry => ReferenceEquals(entry.Entity, room));
                if (failed is null) throw;
                var existing = await FindRoomAsync(room.ParticipantOneId, room.ParticipantTwoId);
                if (existing is null) throw;
                failed.State = EntityState.Detached;
                room = existing;
            }
        }
        if (await LockRoomAsync(room.ChatConversationId) == 0)
            throw new NotFoundException("گفت‌وگو پیدا نشد.");
        var record = await _blocks.GetAllIncludingDeleted()
            .SingleOrDefaultAsync(x => x.ConversationId == room.ChatConversationId && x.BlockedByUserId == actorId);
        if (record is null && blocked)
            await _blocks.AddAsync(new ChatConversationBlock { ConversationId = room.ChatConversationId, BlockedByUserId = actorId });
        else if (record is not null && record.IsDeleted == blocked)
        {
            record.IsDeleted = !blocked;
            record.UpdatedAt = DateTimeOffset.UtcNow;
            if (blocked) record.BlockedAt = record.UpdatedAt.Value;
            await _blocks.UpdateAsync(record);
        }
        await _unitOfWork.SaveChangesAsync();
        await transaction.CommitAsync();
        return room.Code;
    }

    private IQueryable<ChatConversationBlock> ActiveBlocks(int roomId) =>
        _blocks.GetAll().Where(x => x.ConversationId == roomId && !x.IsDeleted);

    // Sending, editing and changing the block state must serialize on the same room row.
    private Task<int> LockRoomAsync(int roomId) => _conversationRepository.GetAll()
        .Where(x => x.ChatConversationId == roomId && !x.IsDeleted)
        .ExecuteUpdateAsync(set => set.SetProperty(x => x.LastMessageAt, x => x.LastMessageAt));

    private async Task EnsureRoomWritableAsync(int roomId)
    {
        if (await LockRoomAsync(roomId) == 0 || await ActiveBlocks(roomId).AnyAsync())
            throw new ForbiddenException("ارسال یا ویرایش پیام در این گفت‌وگو امکان‌پذیر نیست.");
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
