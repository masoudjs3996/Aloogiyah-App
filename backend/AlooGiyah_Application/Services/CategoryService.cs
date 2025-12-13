using AlooGiyah_Application.DTOs.Category;
using AlooGiyah_Application.DTOs.File;
using AlooGiyah_Application.Interfaces;
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

    public CategoryService(
        IGenericRepository<Category> categoryRepo,
        IGenericRepository<Files> fileRepo,
        IGenericRepository<Status> statusRepo,
        IFileService fileService,
        IMapper mapper,
        IMemoryCache cache,
        IUnitOfWork unitOfWork)
    {
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
        if (_cache.TryGetValue(TreeCacheKey, out List<CategoryDto> cached))
            return cached;

        var page = await _categoryRepository.GetPagedProjectedAsync(
            filter: c => !c.IsDeleted,
            selector: c => new
            {
                c.Code,
                c.Name,
                c.Slug,
                c.ParentCategoryId,
                c.MetaTitle,
                c.MetaDescription,
                c.MetaKeywords,
                c.SortOrder,
                StatusCode = c.Status != null ? c.Status.Code : "ACTIVE",
                StatusName = c.Status != null ? c.Status.Name : "فعال"
            },
            orderBy: c => c.Name,
            pageNumber: 1,
            pageSize: 5000
        );

        var raw = page.Items.ToList();
        if (!raw.Any())
        {
            var empty = new List<CategoryDto>();
            _cache.Set(TreeCacheKey, empty, TimeSpan.FromMinutes(10));
            return empty;
        }

        var codes = raw.Select(x => x.Code).ToList();

        // تبدیل ParentCategoryId → ParentCategoryCode (یک کوئری)
        var parentIds = raw.Where(x => x.ParentCategoryId.HasValue).Select(x => x.ParentCategoryId!.Value).Distinct().ToList();
        var parentMap = new Dictionary<int, string>();

        if (parentIds.Any())
        {
            var parents = await _categoryRepository.GetPagedProjectedAsync(
                filter: c => parentIds.Contains(c.CategoryId),
                selector: c => new { c.CategoryId, c.Code },
                pageNumber: 1,
                pageSize: parentIds.Count
            );
            parentMap = parents.Items.ToDictionary(x => x.CategoryId, x => x.Code);
        }

        var dtoList = new List<CategoryDto>();

        foreach (var c in raw)
        {
            var dto = new CategoryDto
            {
                Code = c.Code,
                Name = c.Name,
                Slug = c.Slug,
                ParentCategoryCode = c.ParentCategoryId.HasValue ? parentMap.GetValueOrDefault(c.ParentCategoryId.Value) : null,
                MetaTitle = c.MetaTitle ?? string.Empty,
                MetaDescription = c.MetaDescription ?? string.Empty,
                MetaKeywords = c.MetaKeywords,
                StatusCode = c.StatusCode,
                statusName = c.StatusName,
                SortOrder = c.SortOrder,
                SubCategories = new List<CategoryDto>()
            };

            // فقط یک عکس — با متد موجود
            dto.ImageUrl = await _fileService.GetPrimaryFileUrlAsync(EntityFile.Category, c.Code);

            dtoList.Add(dto);
        }

        // ساخت درخت
        var codeToDto = dtoList.ToDictionary(x => x.Code);
        var roots = new List<CategoryDto>();

        foreach (var dto in dtoList)
        {
            if (string.IsNullOrEmpty(dto.ParentCategoryCode))
                roots.Add(dto);
            else if (codeToDto.TryGetValue(dto.ParentCategoryCode!, out var parent))
                parent.SubCategories.Add(dto);
        }

        SortTree(roots);
        _cache.Set(TreeCacheKey, roots, TimeSpan.FromMinutes(30));
        return roots;
    }
    #endregion

    #region GetCategoriesByTypeAsync
    public async Task<List<CategoryDto>> GetCategoriesByTypeAsync(CategoryFetchType type)
    {
        int statusId = type switch
        {
            CategoryFetchType.Home => 53,
            CategoryFetchType.Menu => 54,
            CategoryFetchType.Featured => 55,
            _ => 0
        };

        var page = await _categoryRepository.GetPagedProjectedAsync(
            filter: c => !c.IsDeleted && c.StatusId == statusId,
            selector: c => c,
            orderBy: c => c.SortOrder,
            pageNumber: 1,
            pageSize: 100
        );

        var items = page.Items.ToList();

        var categoryDto = _mapper.Map<List<CategoryDto>>(items);

        // اضافه کردن عکس
        foreach (var dto in categoryDto)
        {
            dto.ImageUrl = await _fileService.GetPrimaryFileUrlAsync(EntityFile.Category, dto.Code);
        }

        return categoryDto;
    }
    #endregion

    #region Admin filter + paging
    public async Task<PagedResult<CategoryListDto>> GetFilteredAsync(CategoryFilterDto filter)
    {
        if (filter == null) throw new ArgumentNullException(nameof(filter));

        int? parentId = null;
        if (!string.IsNullOrEmpty(filter.ParentCategoryCode))
        {
            parentId = await _categoryRepository.GetIdByCodeAsync(filter.ParentCategoryCode, c => c.CategoryId);
        }

        var page = await _categoryRepository.GetPagedProjectedAsync(
            filter: c => !c.IsDeleted &&
                         (string.IsNullOrEmpty(filter.SearchTerm) ||
                          c.Name.Contains(filter.SearchTerm) ||
                          c.Code.Contains(filter.SearchTerm)) &&
                         (!parentId.HasValue || c.ParentCategoryId == parentId) &&
                         (string.IsNullOrEmpty(filter.StatusCode) ||
                          (c.Status != null && c.Status.Code == filter.StatusCode)),
            selector: c => new CategoryListDto
            {
                Code = c.Code,
                Name = c.Name,
                Slug = c.Slug,
                ParentCategoryCode = c.ParentCategory != null ? c.ParentCategory.Code : null
            },
            orderBy: c => c.SortOrder,
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize
        );

        var items = page.Items.ToList();

        // رفع ارور ۱: لوپ برای عکس
        foreach (var item in items)
        {
            item.ImageUrl = await _fileService.GetPrimaryFileUrlAsync(EntityFile.Category, item.Code);
        }

        // رفع ارور ۲: object initializer
        return new PagedResult<CategoryListDto>
        {
            Items = items,
            TotalCount = page.TotalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }
    #endregion

    #region Get By Code
    public async Task<CategoryDto> GetByCodeAsync(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentNullException(nameof(code));

        // رفع ارور ۳: استفاده از FirstOrDefaultAsync مستقیم
        var cat = await _categoryRepository.FirstOrDefaultAsync(c => c.Code == code && !c.IsDeleted);

        if (cat == null)
            throw new NotFoundException("دسته‌بندی یافت نشد");

        // دستی مپ کن
        var dto = _mapper.Map<CategoryDto>(cat);

        dto.ImageUrl = await _fileService.GetPrimaryFileUrlAsync(EntityFile.Category, code);

        return dto;
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
