using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.Category;
using AlooGiyah_Application.DTOs.Comment;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System;

using System.Linq.Expressions;

namespace AlooGiyah_Application.Services;

public class CommentService : ICommentService
{
    private readonly ICommentQuery _readQuery;

    #region Constractor
    private readonly IGenericRepository<Comment> _commentRepository;
    private readonly IGenericRepository<Status> _statusRepository;
    private readonly IRepositoryFactory _repositoryFactory;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CommentService(ICommentQuery readQuery,
        
        IGenericRepository<Comment> commentRepository,
        IGenericRepository<Status> statusRepository,
        IRepositoryFactory repositoryFactory,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _readQuery = readQuery;
        _commentRepository = commentRepository;
        _statusRepository = statusRepository;
        _repositoryFactory = repositoryFactory;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion


    #region Create
    public async Task<CommentDto> CreateAsync(CommentCreateDto dto)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        // گرفتن کاربر
        var userId = int.Parse(_currentUserService.UserId);

        Comment? parentComment = null;
        if (!string.IsNullOrEmpty(dto.ParentCode))
        {
            var Comment = await _commentRepository.GetByCodeAsync(dto.ParentCode);
            if (Comment == null)
                throw new NotFoundException("کامنت والد پیدا نشد");
            parentComment = Comment;

            if (parentComment.ParentCommentId.HasValue)
                throw new InvalidOperationException("پاسخ به ساب‌کامنت مجاز نیست");
        }

        // اعتبارسنجی Rating
        if (dto.Rating.HasValue && (dto.Rating < 1 || dto.Rating > 5))
            throw new InvalidOperationException("امتیاز باید بین 1 تا 5 باشد");

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var entity = _mapper.Map<Comment>(dto);
            entity.EntityComment = dto.EntityComment;
            if (parentComment != null)
                entity.ParentCommentId = parentComment.CommentId;
            entity.UserId = userId;
            // کامنت در انتضار تایید
            entity.StatusId = 81;

            await _commentRepository.AddAsync(entity);
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            var commentDto = _mapper.Map<CommentDto>(entity);



            return commentDto;
        }
        catch 
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(CommentUpdateDto dto)
    {
        var entity = await _commentRepository.GetByCodeAsync(dto.Code);
        if (entity == null)
            return false;

        if (!string.IsNullOrEmpty(dto.StatusCode))
        {
            var statusId = await _statusRepository.GetIdByCodeAsync(dto.StatusCode, s => s.StatusId);
            if (statusId == null)
                throw new NotFoundException($"وضعیت با کد {dto.StatusCode} پیدا نشد");
            entity.StatusId = statusId.Value;
        }

        // اعتبارسنجی Rating
        if (dto.Rating.HasValue && (dto.Rating < 1 || dto.Rating > 5))
            throw new InvalidOperationException("امتیاز باید بین 1 تا 5 باشد");

        entity.Content = dto.Content;
        entity.Rating = dto.Rating;
        

        await _commentRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var entity = await _commentRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        await _commentRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Get By Code
    public async Task<CommentDto?> GetByCodeAsync(string code)
    {
        return await _readQuery.GetByCodeAsync(code);
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<CommentDto>> GetByFilterAsync(CommentFilterDto filter)
    {
        return await _readQuery.GetByFilterAsync(filter);
    }
    #endregion

    #region Comment Tree Filter
    public async Task<List<CommentDto>> GetTreeCommentsAsync(CommentTreeFilterDto filter)
    {
        return await _readQuery.GetTreeCommentsAsync(filter);
    }
#endregion


    #region Validate Entity Code Async
    private async Task<bool> ValidateEntityCodeAsync(EntityComment entityType, string? entityCode)
    {
        if (string.IsNullOrEmpty(entityCode))
            return true;

        var repositoryMap = new Dictionary<EntityComment, Func<string, Task<bool>>>
        {
            { EntityComment.Product, async (code) => await _repositoryFactory.GetCommentRepository<Product>(entityType).ExistsAsync(e => e.Code == code) },
            { EntityComment.Article, async (code) => await _repositoryFactory.GetCommentRepository<Article>(entityType).ExistsAsync(e => e.Code == code) },
            { EntityComment.AgriculturalProduct, async (code) => await _repositoryFactory.GetCommentRepository<AgriculturalProduct>(entityType).ExistsAsync(e => e.Code == code) },
            { EntityComment.ServiceRequest, async (code) => await _repositoryFactory.GetCommentRepository<ServiceRequest>(entityType).ExistsAsync(e => e.Code == code) },
            { EntityComment.Auction, async (code) => await _repositoryFactory.GetCommentRepository<Auction>(entityType).ExistsAsync(e => e.Code == code) },
        };

        if (!repositoryMap.ContainsKey(entityType))
            throw new InvalidOperationException($"EntityFile {entityType} is not supported.");

        return await repositoryMap[entityType](entityCode);
    }
    #endregion
}