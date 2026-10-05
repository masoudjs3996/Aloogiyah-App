using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.Category;
using AlooGiyah_Application.DTOs.File;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Exceptions;
using AlooGiyah_Shared.Seo;
using AutoMapper;
using Microsoft.Extensions.Caching.Memory;

namespace AlooGiyah_Application.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryQuery _readQuery;

    #region Constructor
    private readonly IGenericRepository<Category> _categoryRepository;
    private readonly IGenericRepository<Files> _fileRepo;
    private readonly IGenericRepository<Status> _statusRepo;
    private readonly IFileService _fileService;
    private readonly IMapper _mapper;
    private readonly IMemoryCache _cache;
    private readonly IUnitOfWork _unitOfWork;

    private const string TreeCacheKey = "Category_Tree_V3";
    private const string HomeCacheKey = "Category_Home_V3";

    public CategoryService(ICategoryQuery readQuery,
        
        IGenericRepository<Category> categoryRepo,
        IGenericRepository<Files> fileRepo,
        IGenericRepository<Status> statusRepo,
        IFileService fileService,
        IMapper mapper,
        IMemoryCache cache,
        IUnitOfWork unitOfWork)
    {
        _readQuery = readQuery;
        _categoryRepository = categoryRepo ?? throw new ArgumentNullException(nameof(categoryRepo));
        _fileRepo = fileRepo ?? throw new ArgumentNullException(nameof(fileRepo));
        _statusRepo = statusRepo ?? throw new ArgumentNullException(nameof(statusRepo));
        _fileService = fileService ?? throw new ArgumentNullException(nameof(fileService));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
    }
    #endregion


    #region Full tree
    public async Task<List<CategoryDto>> GetCategoryTreeAsync()
    {
        if (_cache.TryGetValue(TreeCacheKey, out List<CategoryDto>? cached) && cached != null) return cached;
        var result = await _readQuery.GetCategoryTreeAsync(); _cache.Set(TreeCacheKey, result, TimeSpan.FromMinutes(30)); return result;
    }
    #endregion

    #region GetCategoriesByTypeAsync
    public async Task<List<CategoryDto>> GetCategoriesByTypeAsync(CategoryFetchType type)
    {
        return await _readQuery.GetCategoriesByTypeAsync(type);
    }
    #endregion

    #region Admin filter + paging
    public async Task<PagedResult<CategoryListDto>> GetFilteredAsync(CategoryFilterDto filter)
    {
        return await _readQuery.GetFilteredAsync(filter);
    }
    #endregion

    #region Get By Code
    public async Task<CategoryDto> GetByCodeAsync(string code)
    {
        return await _readQuery.GetByCodeAsync(code) ?? throw new NotFoundException("دسته‌بندی یافت نشد.");
    }
    #endregion

    #region Create
    public async Task<CategoryDto> CreateAsync(CategoryCreateDto dto)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));

        // basic validations
        var slug = string.IsNullOrWhiteSpace(dto.Slug) ? SeoHelper.GenerateSlug(dto.Name) : SeoHelper.GenerateSlug(dto.Slug);

        // check duplicates
        var exists = await _categoryRepository.ExistsAsync(c => !c.IsDeleted && (c.Name == dto.Name || c.Slug == slug));
        if (exists) throw new BadRequestException("دسته‌ای با نام یا اسلاگ مشابه وجود دارد");

        var entity = _mapper.Map<Category>(dto);

        if (!string.IsNullOrEmpty(dto.ParentCategoryCode))
        {
            var pid = await _categoryRepository.GetIdByCodeAsync(dto.ParentCategoryCode, c => c.CategoryId);
            if (!pid.HasValue) throw new NotFoundException("دسته والد یافت نشد");
            entity.ParentCategoryId = pid.Value;
        }

        if (!string.IsNullOrEmpty(dto.StatusCode))
        {
            var sid = await _statusRepo.GetIdByCodeAsync(dto.StatusCode, s => s.StatusId);
            if (sid.HasValue) entity.StatusId = sid.Value;
        }

        await _categoryRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        // Clear caches
        _cache.Remove(TreeCacheKey);
        _cache.Remove(HomeCacheKey);

        // return created
        var createdCode = await _categoryRepository.GetCodeByIdAsync(entity.CategoryId);
        return await GetByCodeAsync(createdCode ?? entity.Code);
    }
    #endregion

    #region ChangeCategoryImageAsync
    public async Task<string?> ChangeCategoryImageAsync(UploadCategoryImageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))
            throw new BadRequestException("کد دسته‌بندی الزامی است");

        if (dto.File == null || dto.File.Length == 0)
            throw new BadRequestException("فایل انتخاب نشده");

        if (!dto.File.ContentType.StartsWith("image/"))
            throw new BadRequestException("فقط فایل تصویری مجاز است");

        var category = await _categoryRepository.FirstOrDefaultAsync(c => c.Code == dto.Code && !c.IsDeleted)
                       ?? throw new NotFoundException("دسته‌بندی یافت نشد");

        var uploadDto = new FileUploadDto
        {
            File = dto.File,
            EntityCode = dto.Code,
            EntityFile = EntityFile.Category,
            FileTypeCode = "CD5A1A3870"
        };

        var newFile = await _fileService.UploadFileAsync(uploadDto);

        // حذف عکس قبلی + ست کردن جدید به عنوان Primary
        await _fileService.RemovePrimaryFileAsync(EntityFile.Category, dto.Code);
        await _fileService.AttachFileAsPrimaryAsync(newFile.FileCode, EntityFile.Category, dto.Code);

        category.UpdatedAt = DateTimeOffset.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        return await _fileService.GetPrimaryFileUrlAsync(EntityFile.Category, dto.Code);
    }
    #endregion

    #region Update
    public async Task<CategoryDto> UpdateAsync(CategoryUpdateDto dto)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));

        var entity = await _categoryRepository.GetByCodeAsync(dto.CategoryCode);
        if (entity == null || entity.IsDeleted) throw new NotFoundException("دسته‌بندی یافت نشد");

        var slug = string.IsNullOrWhiteSpace(dto.Slug) ? SeoHelper.GenerateSlug(dto.Name) : SeoHelper.GenerateSlug(dto.Slug);

        // duplicate check excluding current
        var dup = await _categoryRepository.ExistsAsync(c => !c.IsDeleted && c.CategoryId != entity.CategoryId && (c.Name == dto.Name || c.Slug == slug));
        if (dup) throw new BadRequestException("نام یا اسلاگ انتخابی قبلا استفاده شده است");

        entity.Name = dto.Name.Trim();
        entity.Slug = slug;
        entity.Icon = dto.Icon;
        entity.MetaTitle = dto.MetaTitle ?? string.Empty;
        entity.MetaDescription = dto.MetaDescription ?? string.Empty;
        entity.MetaKeywords = dto.MetaKeywords;
        entity.SortOrder = dto.SortOrder ?? entity.SortOrder;

        if (!string.IsNullOrEmpty(dto.ParentCategoryCode))
        {
            var pid = await _categoryRepository.GetIdByCodeAsync(dto.ParentCategoryCode, c => c.CategoryId);
            if (!pid.HasValue) throw new NotFoundException("دسته والد یافت نشد");
            // prevent circular parent
            if (pid.Value == entity.CategoryId) throw new BadRequestException("دسته نمیتواند والد خودش باشد");
            entity.ParentCategoryId = pid.Value;
        }
        else
        {
            entity.ParentCategoryId = null;
        }

        if (!string.IsNullOrEmpty(dto.StatusCode))
        {
            var sid = await _statusRepo.GetIdByCodeAsync(dto.StatusCode, s => s.StatusId);
            if (sid.HasValue) entity.StatusId = sid.Value;
        }

        await _categoryRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        _cache.Remove(TreeCacheKey);
        _cache.Remove(HomeCacheKey);

        return await GetByCodeAsync(entity.Code);
    }
    #endregion

    #region Logical delete
    public async Task<bool> LogicalDeleteAsync(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) throw new ArgumentNullException(nameof(code));

        var entity = await _categoryRepository.GetByCodeAsync(code);
        if (entity == null) throw new NotFoundException("دسته‌بندی یافت نشد");

        await _categoryRepository.LogicalDeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        _cache.Remove(TreeCacheKey);
        _cache.Remove(HomeCacheKey);
        return true;
    }
    #endregion

    #region SortTree
    private void SortTree(List<CategoryDto> nodes)
    {
        nodes.Sort((a, b) => a.SortOrder.CompareTo(b.SortOrder));
        foreach (var node in nodes)
            if (node.SubCategories != null && node.SubCategories.Any())
                SortTree(node.SubCategories);
    }
    #endregion
}
