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
using System.Data.Entity.Core.Common.CommandTrees.ExpressionBuilder;
using System.Linq.Expressions;

namespace AlooGiyah_Application.Services;

public class CommentService : ICommentService
{
    #region Constractor
    private readonly IGenericRepository<Comment> _commentRepository;
    private readonly IGenericRepository<Status> _statusRepository;
    private readonly IRepositoryFactory _repositoryFactory;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CommentService(
        IGenericRepository<Comment> commentRepository,
        IGenericRepository<Status> statusRepository,
        IRepositoryFactory repositoryFactory,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
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
        var entity = await _commentRepository.GetByCodeWithIncludeAsync(
            code,
            c => c.User,
            c => c.Status,
            c => c.SubComments,
            c => c.SubComments.Select(sc => sc.User) // یوزرهای ساب‌کامنت هم لود بشه
        );

        if (entity == null)
            return null;

        var commentDto = new CommentDto
        {
            Code = entity.Code,
            Content = entity.Content,
            UserCode = entity.User.Code,
            Name = $"{entity.User.FName} {entity.User.LName}",
            Rating = entity.Rating,
            EntityCode = entity.EntityCode,
            EntityComment = entity.EntityComment,
            StatusCode = entity.Status.Code,
            CreatedAt = entity.CreatedAt,
            SubComments = entity.SubComments
                .Where(sc => !sc.IsDeleted)
                .Select(sc => new CommentDto
                {
                    Code = sc.Code,
                    Content = sc.Content,
                    UserCode = sc.User.Code,
                    Name = $"{sc.User.FName} {sc.User.LName}",
                    Rating = sc.Rating,
                    EntityCode = sc.EntityCode,
                    EntityComment = sc.EntityComment,
                    CreatedAt = sc.CreatedAt
                }).ToList()
        };

        return commentDto;
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<CommentDto>> GetByFilterAsync(CommentFilterDto filter)
    {
        Expression<Func<Comment, bool>> predicate = c => !c.IsDeleted;

        if (!string.IsNullOrEmpty(filter.EntityCode) && filter.EntityComment.HasValue)
        {
            var isValidEntity = await ValidateEntityCodeAsync(filter.EntityComment.Value, filter.EntityCode);
            if (!isValidEntity)
                throw new InvalidOperationException(
                    $"Entity with code {filter.EntityCode} not found for EntityFile {filter.EntityComment.Value}.");
        }

        if (!string.IsNullOrEmpty(filter.EntityCode))
            predicate = predicate.And(f => f.EntityCode == filter.EntityCode);

        if (filter.EntityComment.HasValue)
            predicate = predicate.And(f => f.EntityComment == filter.EntityComment.Value);

        if (filter.MinRating.HasValue)
            predicate = predicate.And(c => c.Rating >= filter.MinRating.Value);

        if (filter.MaxRating.HasValue)
            predicate = predicate.And(c => c.Rating <= filter.MaxRating.Value);

        if (!string.IsNullOrEmpty(filter.StatusCode))
            predicate = predicate.And(f => f.Status.Code == filter.StatusCode);

        if (filter.StartDate.HasValue)
            predicate = predicate.And(c => c.CreatedAt >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            predicate = predicate.And(c => c.CreatedAt <= filter.EndDate.Value);

        return await _commentRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: c => new CommentDto
            {
                Code = c.Code,
                Content = c.Content,
                UserCode = c.User.Code,
                Name = $"{c.User.FName} {c.User.LName}",
                Rating = c.Rating,
                EntityCode = c.EntityCode,
                EntityComment = c.EntityComment,
                StatusCode = c.Status.Code,
                CreatedAt = c.CreatedAt,
               
            },
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: c => c.CreatedAt
        );
    }
    #endregion

    #region Comment Tree Filter
    public async Task<List<CommentDto>> GetTreeCommentsAsync(CommentTreeFilterDto filter)
    {
        Expression<Func<Comment, bool>> predicate = c => !c.IsDeleted;

        if (!string.IsNullOrEmpty(filter.EntityCode) && filter.EntityComment.HasValue)
        {
            var isValidEntity = await ValidateEntityCodeAsync(filter.EntityComment.Value, filter.EntityCode);
            if (!isValidEntity)
                throw new InvalidOperationException(
                    $"Entity with code {filter.EntityCode} not found for EntityFile {filter.EntityComment.Value}.");
        }

        if (!string.IsNullOrEmpty(filter.EntityCode))
            predicate = predicate.And(f => f.EntityCode == filter.EntityCode);

        if (filter.EntityComment.HasValue)
            predicate = predicate.And(f => f.EntityComment == filter.EntityComment.Value);

        // فیلتر کردن برای استاتوس کد کامنت فعال
            predicate = predicate.And(f => f.StatusId == 82);


        // مرحله 1: دریافت تمام کامنت‌ها با فیلترهای اولیه
        var comments = await _commentRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: c => new CommentDto            {
                Code = c.Code,
                Content = c.Content,
                UserCode = c.User.Code,
                Name = $"{c.User.FName} {c.User.LName}",
                Rating = c.Rating,
                ParentId = c.ParentCommentId,
                ParentCode =c.ParentComment.Code,
                EntityCode = c.EntityCode,
                StatusCode = c.Status.Code,
                EntityComment = c.EntityComment,
                CreatedAt = c.CreatedAt,
                SubComments = new List<CommentDto>()
            },
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: c => c.CreatedAt
        );

        var raw = comments.Items.ToList();
        if (!raw.Any())
        {
            return new List<CommentDto>();
        }

        // مرحله 2: ساخت دیکشنری برای دسترسی سریع به کامنت‌ها
        var codeToDto = raw.ToDictionary(c => c.Code);
        var roots = new List<CommentDto>();

        // تبدیل ParentCommentId به ParentCode
        var parentIds = raw.Where(x => x.ParentId.HasValue).Select(x => x.ParentId.Value).Distinct().ToList();
        var parentMap = new Dictionary<int, string>();

        if (parentIds.Any())
        {
            var parents = await _commentRepository.GetPagedProjectedAsync(
                filter: c => parentIds.Contains(c.CommentId),
                selector: c => new { c.CommentId, c.Code },
                pageNumber: 1,
                pageSize: parentIds.Count
            );
            parentMap = parents.Items.ToDictionary(x => x.CommentId, x => x.Code);
        }

        // مرحله 3: ساخت درخت
        foreach (var comment in raw)
        {
            if (comment.ParentId.HasValue)
            {
                // اگر کامنت والد دارد، آن را به ساب کامنت اضافه کن
                if (parentMap.TryGetValue(comment.ParentId.Value, out var parentCode) && codeToDto.TryGetValue(parentCode, out var parentComment))
                {
                    parentComment.SubComments.Add(comment);
                }
            }
            else
            {
                // اگر کامنت والد ندارد، آن را به ریشه‌ها اضافه کن
                roots.Add(comment);
            }
        }

        return roots;
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