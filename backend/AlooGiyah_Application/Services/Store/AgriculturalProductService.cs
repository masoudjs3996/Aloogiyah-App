using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Application.Interfaces.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AlooGiyah_Shared.Seo;
using AutoMapper;
using System.Linq.Expressions;

namespace AlooGiyah_Application.Services.Store;

public class AgriculturalProductService : IAgriculturalProductService
{
    #region Constructor
    private readonly IGenericRepository<AgriculturalProduct> _agriculturalProductRepository;
    private readonly IGenericRepository<Farm> _greenhouseRepository;
    private readonly IGenericRepository<Status> _statusRepository;
    private readonly IGenericRepository<Category> _categoryRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AgriculturalProductService(
        IGenericRepository<AgriculturalProduct> agriculturalProductRepository,
        IGenericRepository<Farm> greenhouseRepository,
        IGenericRepository<Status> statusRepository,
        IGenericRepository<Category> categoryRepository,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _agriculturalProductRepository = agriculturalProductRepository;
        _greenhouseRepository = greenhouseRepository;
        _statusRepository = statusRepository;
        _categoryRepository = categoryRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion

    #region Create
    public async Task<AgriculturalProductDto> CreateAsync(AgriculturalProductCreateDto dto)
    {
        // اعتبارسنجی‌ها
        if (dto.RetailPrice < 0 || dto.WholesalePrice < 0)
            throw new ValidationException("قیمت‌ها نمی‌توانند منفی باشند", new Dictionary<string, string[]>
        {
            { "RetailPrice", new[] { "قیمت خرده‌فروشی نمی‌تواند منفی باشد" } },
            { "WholesalePrice", new[] { "قیمت عمده‌فروشی نمی‌تواند منفی باشد" } }
        });

        if (dto.Stock < 0)
            throw new InvalidOperationException("موجودی نمی‌تواند منفی باشد");

        // گرفتن گلخانه
        var greenhouseId = await _greenhouseRepository.GetIdByCodeAsync(dto.GreenhouseCode, g => g.FarmId);
        if (greenhouseId == null)
            throw new NotFoundException($"گلخانه با کد {dto.GreenhouseCode} پیدا نشد");

        // گرفتن وضعیت
        var statusId = await _statusRepository.GetIdByCodeAsync(dto.StatusCode, s => s.StatusId);
        if (statusId == null)
            throw new NotFoundException($"وضعیت با کد {dto.StatusCode} پیدا نشد");

        // گرفتن دسته‌بندی‌ها
        var categories = new List<Category>();
        if (dto.CategoryCodes?.Any() ?? false)
        {
            foreach (var categoryCode in dto.CategoryCodes.Distinct())
            {
                var category = await _categoryRepository.GetByCodeAsync(categoryCode);
                if (category == null)
                    throw new NotFoundException($"دسته‌بندی با کد {categoryCode} پیدا نشد");
                categories.Add(category);
            }
        }

        var entity = _mapper.Map<AgriculturalProduct>(dto);
        entity.FarmId = greenhouseId.Value; // ربط به گلخانه
        entity.StatusId = statusId.Value;
        entity.Categories = categories;

        // SEO fields
        entity.MetaTitle = dto.MetaTitle ?? SeoHelper.GenerateMetaTitle(dto.Name);
        entity.MetaDescription = dto.MetaDescription ?? SeoHelper.GenerateMetaDescription(dto.Name);
        entity.MetaKeywords = dto.MetaKeywords ?? SeoHelper.GenerateMetaKeywords(dto.Name);

        // Slug
        var greenhouse = await _greenhouseRepository.GetByIdAsync(greenhouseId.Value);
        string greenhouseName = greenhouse?.Name ?? "";

        string baseSlug = SeoHelper.GenerateSlug($"{entity.Name}-{greenhouseName}");
        string slug = baseSlug;
        int counter = 1;

        while (await _agriculturalProductRepository.ExistsAsync(p => p.Slug == slug))
        {
            slug = $"{baseSlug}-{counter}";
            counter++;
        }

        entity.Slug = slug;


        await _agriculturalProductRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        var productDto = _mapper.Map<AgriculturalProductDto>(entity);
        productDto.GreenhouseCode = dto.GreenhouseCode; // به‌جای FarmerCode
        productDto.StatusCode = dto.StatusCode;
        productDto.CategoryCodes = categories.Select(c => c.Code).ToList();

        return productDto;
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(AgriculturalProductUpdateDto dto)
    {
        var entity = await _agriculturalProductRepository.GetByCodeWithIncludeAsync(
            dto.Code,
            p => p.Categories,
            p => p.Farm
        );

        if (entity == null)
            throw new NotFoundException($"محصول با کد {dto.Code} پیدا نشد");

        // اعتبارسنجی‌ها مثل Create
        if (dto.RetailPrice < 0 || dto.WholesalePrice < 0)
            throw new ValidationException("قیمت‌ها نمی‌توانند منفی باشند", new Dictionary<string, string[]>
        {
            { "RetailPrice", new[] { "قیمت خرده‌فروشی نمی‌تواند منفی باشد" } },
            { "WholesalePrice", new[] { "قیمت عمده‌فروشی نمی‌تواند منفی باشد" } }
        });

        if (dto.Stock < 0)
            throw new InvalidOperationException("موجودی نمی‌تواند منفی باشد");

        // آپدیت گلخانه
        if (!string.IsNullOrEmpty(dto.GreenhouseCode))
        {
            var greenhouseId = await _greenhouseRepository.GetIdByCodeAsync(dto.GreenhouseCode, g => g.FarmId);
            if (greenhouseId == null)
                throw new NotFoundException($"گلخانه با کد {dto.GreenhouseCode} پیدا نشد");
            entity.FarmId = greenhouseId.Value;
        }

        // آپدیت وضعیت
        if (!string.IsNullOrEmpty(dto.StatusCode))
        {
            var statusId = await _statusRepository.GetIdByCodeAsync(dto.StatusCode, s => s.StatusId);
            if (statusId == null)
                throw new NotFoundException($"وضعیت با کد {dto.StatusCode} پیدا نشد");
            entity.StatusId = statusId.Value;
        }

        // آپدیت دسته‌بندی‌ها
        if (dto.CategoryCodes?.Any() ?? false)
        {
            entity.Categories.Clear();
            foreach (var categoryCode in dto.CategoryCodes.Distinct())
            {
                var category = await _categoryRepository.GetByCodeAsync(categoryCode);
                if (category == null)
                    throw new NotFoundException($"دسته‌بندی با کد {categoryCode} پیدا نشد");
                entity.Categories.Add(category);
            }
        }

        // مپ کردن بقیه فیلدها
        _mapper.Map(dto, entity);

        // SEO
        entity.MetaTitle = dto.MetaTitle ?? SeoHelper.GenerateMetaTitle(entity.Name);
        entity.MetaDescription = dto.MetaDescription ?? SeoHelper.GenerateMetaDescription(entity.Name);
        entity.MetaKeywords = dto.MetaKeywords ?? SeoHelper.GenerateMetaKeywords(entity.Name);

        // Slug (با نام گلخانه)
        var greenhouse = await _greenhouseRepository.GetByIdAsync(entity.FarmId);
        string greenhouseName = greenhouse?.Name ?? "";
        string baseSlug = SeoHelper.GenerateSlug($"{entity.Name}-{greenhouseName}");
        string slug = baseSlug;
        int counter = 1;
        while (await _agriculturalProductRepository.ExistsAsync(p => p.Slug == slug && p.AgriculturalProductId != entity.AgriculturalProductId))
        {
            slug = $"{baseSlug}-{counter}";
            counter++;
        }
        entity.Slug = slug;

        await _agriculturalProductRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        var productDto = _mapper.Map<AgriculturalProductDto>(entity);
        productDto.GreenhouseCode = dto.GreenhouseCode;
        productDto.StatusCode = dto.StatusCode;
        productDto.CategoryCodes = entity.Categories.Select(c => c.Code).ToList();

        return true;
    }

    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var entity = await _agriculturalProductRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        await _agriculturalProductRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Get By Code
    public async Task<AgriculturalProductDto?> GetByCodeAsync(string code)
    {

        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        var Role = _currentUserService.Roles.FirstOrDefault();

        if (string.IsNullOrEmpty(code))
            throw new ArgumentNullException(nameof(code));

        var entity = await _agriculturalProductRepository.GetByCodeWithIncludeAsync(
            code: code,
            includes: new Expression<Func<AgriculturalProduct, object>>[] { p => p.Categories, p => p.Farm }
        );

        if (entity == null)
            return null;

        var productDto = _mapper.Map<AgriculturalProductDto>(entity);
        productDto.RetailPrice = entity.RetailPrice;
        productDto.WholesalePrice = Role == "User" ? null : entity.WholesalePrice;
        productDto.GreenhouseCode = entity.Farm?.Code ?? string.Empty;
        productDto.StatusCode = await _statusRepository.GetCodeByIdAsync(entity.StatusId) ?? string.Empty;
        productDto.CategoryCodes = entity.Categories?.Select(c => c.Code).ToList() ?? new List<string>();

        return productDto;
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<AgriculturalProductDto>> GetByFilterAsync(AgriculturalProductFilterDto filter)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        Expression<Func<AgriculturalProduct, bool>> predicate = p => !p.IsDeleted;

        var role = _currentUserService.Roles.FirstOrDefault();

        if (!string.IsNullOrEmpty(filter.Name))
            predicate = predicate.And(p => p.Name.Contains(filter.Name));

        if (!string.IsNullOrEmpty(filter.FarmCode)) // به‌جای FarmerCode
            predicate = predicate.And(p => p.Farm.Code == filter.FarmCode);

        if (!string.IsNullOrEmpty(filter.StatusCode))
            predicate = predicate.And(p => p.Status.Code == filter.StatusCode);

        if (role == "User")
        {
            if (filter.MinPrice.HasValue)
                predicate = predicate.And(p => p.RetailPrice >= filter.MinPrice.Value);

            if (filter.MaxPrice.HasValue)
                predicate = predicate.And(p => p.RetailPrice <= filter.MaxPrice.Value);
        }
        else
        {
            if (filter.MinPrice.HasValue)
                predicate = predicate.And(p => p.WholesalePrice >= filter.MinPrice.Value);

            if (filter.MaxPrice.HasValue)
                predicate = predicate.And(p => p.WholesalePrice <= filter.MaxPrice.Value);
        }

        if (filter.MinStock.HasValue)
            predicate = predicate.And(p => p.Stock >= filter.MinStock.Value);

        if (filter.MaxStock.HasValue)
            predicate = predicate.And(p => p.Stock <= filter.MaxStock.Value);



        if (filter.CategoryCodes?.Any() ?? false)
            predicate = predicate.And(p => p.Categories.Any(c => filter.CategoryCodes.Contains(c.Code)));

        return await _agriculturalProductRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: p => new AgriculturalProductDto
            {
                Code = p.Code,
                Name = p.Name,
                Description = p.Description,
                Stock = p.Stock,
                Slug = p.Slug,
                MetaTitle = p.MetaTitle,
                MetaDescription = p.MetaDescription,
                MetaKeywords = p.MetaKeywords,
                DailyProductionCapacity = p.DailyProductionCapacity,
                StatusCode = p.Status.Code,
                CategoryCodes = p.Categories.Select(c => c.Code).ToList(),
                CreatedAt = p.CreatedAt,
                RetailPrice = p.RetailPrice,
                WholesalePrice = role == "User" ? null : p.WholesalePrice
            },
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: p => p.CreatedAt
        );
    }
    #endregion

}