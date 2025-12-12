using AlooGiyah_Application.DTOs.ChatMessage;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Application.Interfaces.UserFolder;
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
    #region Constructor
    private readonly IGenericRepository<ChatMessage> _chatMessageRepository;
    private readonly IGenericRepository<User> _userRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ChatMessageService(
        IGenericRepository<ChatMessage> chatMessageRepository,
        IGenericRepository<User> userRepository,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _chatMessageRepository = chatMessageRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion


    #region Create
    public async Task<ChatMessageDto> CreateAsync(ChatMessageCreateDto dto)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");
        // اعتبارسنجی پیام
        if (string.IsNullOrWhiteSpace(dto.Message))
            throw new InvalidOperationException("پیام نمی‌تواند خالی باشد");

        // گرفتن فرستنده
        var senderId = int.Parse(_currentUserService.UserId);

        // گرفتن گیرنده
        var receiverId = await _userRepository.GetIdByCodeAsync(dto.ReceiverCode, u => u.UserId);
        if (receiverId == null)
            throw new NotFoundException($"کاربر گیرنده با کد {dto.ReceiverCode} پیدا نشد");

        // جلوگیری از ارسال پیام به خود
        if (senderId == receiverId)
            throw new InvalidOperationException("نمی‌توانید به خودتان پیام بفرستید");

        var entity = _mapper.Map<ChatMessage>(dto);
        entity.SenderId = senderId;
        entity.ReceiverId = receiverId.Value;
        entity.IsRead = false;

        await _chatMessageRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        var chatMessageDto = _mapper.Map<ChatMessageDto>(entity);
        chatMessageDto.ReceiverCode = dto.ReceiverCode;

        return chatMessageDto;
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(ChatMessageUpdateDto dto)
    {
        var entity = await _chatMessageRepository.GetByCodeAsync(dto.Code);
        if (entity == null)
            return false;

        // اعتبارسنجی پیام
        if (string.IsNullOrWhiteSpace(dto.Message))
            throw new InvalidOperationException("پیام نمی‌تواند خالی باشد");

        entity.Message = dto.Message;
        if (dto.IsRead.HasValue)
            entity.IsRead = dto.IsRead.Value;

        await _chatMessageRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var entity = await _chatMessageRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        await _chatMessageRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Get By Code
    public async Task<ChatMessageDto?> GetByCodeAsync(string code)
    {
        var entity = await _chatMessageRepository.GetByCodeAsync(code);
        if (entity == null)
            return null;

        var chatMessageDto = _mapper.Map<ChatMessageDto>(entity);
        chatMessageDto.SenderCode = await _userRepository.GetCodeByIdAsync(entity.SenderId) ?? string.Empty;
        chatMessageDto.ReceiverCode = await _userRepository.GetCodeByIdAsync(entity.ReceiverId) ?? string.Empty;

        return chatMessageDto;
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<ChatMessageDto>> GetByFilterAsync(ChatMessageFilterDto filter)
    {
        Expression<Func<ChatMessage, bool>> predicate = cm => !cm.IsDeleted;

        if (!string.IsNullOrEmpty(filter.SenderCode))
            predicate = predicate.And(cm => cm.Sender.Code == filter.SenderCode);

        if (!string.IsNullOrEmpty(filter.ReceiverCode))
            predicate = predicate.And(cm => cm.Receiver.Code == filter.ReceiverCode);

        if (filter.IsRead.HasValue)
            predicate = predicate.And(cm => cm.IsRead == filter.IsRead.Value);

        if (filter.StartDate.HasValue)
            predicate = predicate.And(cm => cm.CreatedAt >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            predicate = predicate.And(cm => cm.CreatedAt <= filter.EndDate.Value);

        return await _chatMessageRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: cm => new ChatMessageDto
            {
                Code = cm.Code,
                Message = cm.Message,
                SenderCode = cm.Sender.Code,
                ReceiverCode = cm.Receiver.Code,
                IsRead = cm.IsRead,
                CreatedAt = cm.CreatedAt
            },
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: cm => cm.CreatedAt
        );
    }
    #endregion

    #region Get Conversation
    public async Task<PagedResult<ChatMessageDto>> GetConversationAsync(string userCode1, string userCode2, int pageNumber, int pageSize)
    {
        var user1Id = await _userRepository.GetIdByCodeAsync(userCode1, u => u.UserId);
        if (user1Id == null)
            throw new NotFoundException($"کاربر با کد {userCode1} پیدا نشد");

        var user2Id = await _userRepository.GetIdByCodeAsync(userCode2, u => u.UserId);
        if (user2Id == null)
            throw new NotFoundException($"کاربر با کد {userCode2} پیدا نشد");

        Expression<Func<ChatMessage, bool>> predicate = cm =>
            !cm.IsDeleted &&
            ((cm.SenderId == user1Id.Value && cm.ReceiverId == user2Id.Value) ||
             (cm.SenderId == user2Id.Value && cm.ReceiverId == user1Id.Value));

        return await _chatMessageRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: cm => new ChatMessageDto
            {
                Code = cm.Code,
                Message = cm.Message,
                SenderCode = cm.Sender.Code,
                ReceiverCode = cm.Receiver.Code,
                IsRead = cm.IsRead,
                CreatedAt = cm.CreatedAt
            },
            pageNumber: pageNumber,
            pageSize: pageSize,
            orderBy: cm => cm.CreatedAt
        );
    }
    #endregion
}