using AlooGiyah_Application.Interfaces.Query;
using System.Linq.Expressions;
using AlooGiyah_Application.DTOs.StatusChangeLog;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Application.Interfaces.Service.UserFolder;

namespace AlooGiyah_Application.Services;

public class StatusChangeLogService
{
    private readonly IStatusChangeLogQuery _readQuery;

    #region Constractor
    private readonly IGenericRepository<StatusChangeLog> _statusChangeLogRepository;
    private readonly IGenericRepository<User> _userRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IGenericRepository<Status> _statusRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public StatusChangeLogService(IStatusChangeLogQuery readQuery,
        
        IGenericRepository<StatusChangeLog> statusChangeLogRepository,
        IGenericRepository<User> userRepository,
        ICurrentUserService currentUserService,
        IGenericRepository<Status> statusRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _readQuery = readQuery;
        _statusChangeLogRepository = statusChangeLogRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
        _statusRepository = statusRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion


    #region Create 
    public async Task<StatusChangeLogDto> CreateAsync(StatusChangeLogCreateDto dto)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        var userId = int.Parse(_currentUserService.UserId);

        var oldStatus = await _statusRepository.GetByCodeAsync(dto.OldStatusCode);
        if (oldStatus == null)
            throw new NotFoundException($"وضعیت با کد {dto.OldStatusCode} پیدا نشد");

        var newStatus = await _statusRepository.GetByCodeAsync(dto.NewStatusCode);
        if (newStatus == null)
            throw new NotFoundException($"وضعیت با کد {dto.NewStatusCode} پیدا نشد");

        var entity = _mapper.Map<StatusChangeLog>(dto);
        entity.EntityStatus = dto.EntityStatus;
        entity.UserId = userId;
        entity.OldStatusId = oldStatus.StatusId;
        entity.NewStatusId = newStatus.StatusId;
        entity.ChangeDate = DateTime.UtcNow;

        await _statusChangeLogRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        var statusChangeLogDto = _mapper.Map<StatusChangeLogDto>(entity);
        statusChangeLogDto.OldStatusCode = dto.OldStatusCode;
        statusChangeLogDto.NewStatusCode = dto.NewStatusCode;
        statusChangeLogDto.EntityStatus = dto.EntityStatus;

        return statusChangeLogDto;
    }
    #endregion

    #region Update 
    public async Task<bool> UpdateAsync(StatusChangeLogUpdateDto dto)
    {
        var entity = await _statusChangeLogRepository.GetByCodeAsync(dto.Code);
        if (entity == null)
            return false;

        // اعتبارسنجی EntityFile
        if (!Enum.TryParse<EntityStatus>(entity.EntityStatus.ToString(), true, out var entityType))
            throw new InvalidOperationException("نوع موجودیت نامعتبر است");

        var userId = await _userRepository.GetIdByCodeAsync(dto.UserCode, u => u.UserId);
        if (userId == null)
            throw new NotFoundException($"کاربر با کد {dto.UserCode} پیدا نشد");

        var oldStatus = await _statusRepository.GetByCodeAsync(dto.OldStatusCode);
        if (oldStatus == null)
            throw new NotFoundException($"وضعیت با کد {dto.OldStatusCode} پیدا نشد");

        var newStatus = await _statusRepository.GetByCodeAsync(dto.NewStatusCode);
        if (newStatus == null)
            throw new NotFoundException($"وضعیت با کد {dto.NewStatusCode} پیدا نشد");

        entity.Comments = dto.Comments;
        entity.UserId = userId.Value;
        entity.OldStatusId = oldStatus.StatusId;
        entity.NewStatusId = newStatus.StatusId;

        await _statusChangeLogRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var entity = await _statusChangeLogRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        await _statusChangeLogRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Get By Code
    public async Task<StatusChangeLogDto?> GetByCodeAsync(string code)
    {
        return await _readQuery.GetByCodeAsync(code);
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<StatusChangeLogDto>> GetByFilterAsync(StatusChangeLogFilterDto filter)
    {
        return await _readQuery.GetByFilterAsync(filter);
    }
    #endregion
}

