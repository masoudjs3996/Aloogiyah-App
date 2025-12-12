using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Application.DTOs.File;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Application.Interfaces.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Enums;
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
    private readonly IGenericRepository<Files> _fileRepo;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileService _fileService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AgriculturalProductService(
        IGenericRepository<AgriculturalProduct> agriculturalProductRepository,
        IGenericRepository<Farm> greenhouseRepository,
        IGenericRepository<Status> statusRepository,
        IGenericRepository<Category> categoryRepository,
        IFileService fileService,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _agriculturalProductRepository = agriculturalProductRepository;
        _greenhouseRepository = greenhouseRepository;
        _statusRepository = statusRepository;
        _categoryRepository = categoryRepository;
        _fileService = fileService;
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
    public async Task<AgriculturalProductDetailDto?> GetByCodeAsync(string code)
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

        var productDto = _mapper.Map<AgriculturalProductDetailDto>(entity);
        productDto.RetailPrice = entity.RetailPrice;
        productDto.WholesalePrice = Role == "User" ? null : entity.WholesalePrice;
        productDto.GreenhouseCode = entity.Farm?.Code ?? string.Empty;
        productDto.StatusCode = await _statusRepository.GetCodeByIdAsync(entity.StatusId) ?? string.Empty;
        productDto.CategoryCodes = entity.Categories?.Select(c => c.Code).ToList() ?? new List<string>();

        var primaryFile = await _fileRepo.FirstOrDefaultAsync(f =>
    f.EntityCode == code &&
    f.EntityFile == EntityFile.AgriculturalProduct &&
    f.IsPrimary);

        productDto.PrimaryImageUrl = primaryFile?.Url ?? "/images/default-product.jpg";

        // همه عکس‌ها
        var allFilesResult = await _fileRepo.GetPagedAsync(
            filter: f => f.EntityCode == code && f.EntityFile == EntityFile.AgriculturalProduct,
            pageNumber: 1,
            pageSize: 50 // یا هر تعداد حداکثری که می‌خوای
        );

        productDto.ImageUrls = allFilesResult.Items.Select(f => f.Url).ToList();

        return productDto;
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<AgriculturalProductListItemDto>> GetByFilterAsync(AgriculturalProductFilterDto filter)
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

        var pagedProducts = await _agriculturalProductRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: p => new AgriculturalProductListItemDto
            {
                Code = p.Code,
                Name = p.Name,
                Description = p.Description,
                Stock = p.Stock,
                Slug = p.Slug,
                StatusCode = p.Status.Code,
                CreatedAt = p.CreatedAt,
                RetailPrice = p.RetailPrice,
                WholesalePrice = role == "User" ? null : p.WholesalePrice,
                PrimaryImageUrl = "" // موقتاً خالی — بعداً پر میشه
            },
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: p => p.CreatedAt
        );
        if (!pagedProducts.Items.Any())
            return pagedProducts;

        // قدم ۲: جمع‌آوری کدهای محصول در این صفحه
        var productCodes = pagedProducts.Items.Select(x => x.Code).ToList();

        // قدم ۳: استفاده از GetPagedAsync روی Files — فقط عکس‌های اصلی محصولات این صفحه
        var primaryFilesResult = await _fileRepo.GetPagedAsync(
            filter: f => productCodes.Contains(f.EntityCode!) &&
                         f.EntityFile == EntityFile.AgriculturalProduct &&
                         f.IsPrimary,
            pageNumber: 1,
            pageSize: productCodes.Count // حداکثر به تعداد محصولات این صفحه
        );

        // قدم ۴: ساخت دیکشنری برای دسترسی سریع
        var primaryImageDict = primaryFilesResult.Items
            .ToDictionary(
                f => f.EntityCode!,
                f => f.Url ?? "/images/default-product.jpg"
            );

        // قدم ۵: پر کردن PrimaryImageUrl هر محصول
        foreach (var item in pagedProducts.Items)
        {
            item.PrimaryImageUrl = primaryImageDict.GetValueOrDefault(item.Code, "/images/default-product.jpg");
        }

        return pagedProducts;

    }
    #endregion

    #region اضافه کردن چند عکس به محصول
    public async Task<List<string>> AddProductImagesAsync(AddProductImagesDto dto)
    {
        var product = await _agriculturalProductRepository.FirstOrDefaultAsync(p => p.Code == dto.ProductCode && !p.IsDeleted)
                      ?? throw new NotFoundException("محصول یافت نشد");

        var uploadedUrls = new List<string>();

        // چک کنیم آیا قبلاً عکس اصلی داشته یا نه
        var hasPrimary = await _fileRepo.ExistsAsync(f =>
            f.EntityCode == dto.ProductCode &&
            f.EntityFile == EntityFile.AgriculturalProduct &&
            f.IsPrimary);

        foreach (var file in dto.Files)
        {
            if (file == null || file.Length == 0) continue;

            if (!file.ContentType.StartsWith("image/"))
                throw new BadRequestException($"فایل {file.FileName} یک تصویر معتبر نیست");

            if (file.Length > 15 * 1024 * 1024)
                throw new BadRequestException($"حجم فایل {file.FileName} بیش از ۱۵ مگابایت است");

            // آپلود فایل از طریق FileService
            var uploadDto = new FileUploadDto
            {
                File = file,
                EntityCode = dto.ProductCode,
                EntityFile = EntityFile.AgriculturalProduct,
                FileTypeCode = "CD5A1A3870" // کد نوع عکس محصول
            };

            var uploadedFile = await _fileService.UploadFileAsync(uploadDto);
            uploadedUrls.Add(uploadedFile.Url); // فرض می‌کنیم FileDto.Url داره

            // اگر اولین عکس بود (هیچ عکسی قبلاً اصلی نبود)، آن را اصلی کن
            if (!hasPrimary && uploadedUrls.Count == 1)
            {
                await _fileService.AttachFileAsPrimaryAsync(
                    uploadedFile.FileCode,
                    EntityFile.AgriculturalProduct,
                    dto.ProductCode);
                hasPrimary = true; // برای جلوگیری از تکرار در لوپ
            }
        }

        product.UpdatedAt = DateTimeOffset.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        return uploadedUrls;
    }
    #endregion

    #region تنظیم عکس اصلی محصول
    public async Task<string> SetPrimaryProductImageAsync(string productCode, string fileCode)
    {
        // چک کنیم فایل متعلق به این محصول باشد
        var fileExists = await _fileRepo.ExistsAsync(f =>
            f.Code == fileCode &&
            f.EntityCode == productCode &&
            f.EntityFile == EntityFile.AgriculturalProduct);

        if (!fileExists)
            throw new NotFoundException("عکس انتخاب‌شده متعلق به این محصول نیست");

        // اول همه را از حالت اصلی خارج کن
        await _fileService.RemovePrimaryFileAsync(EntityFile.AgriculturalProduct, productCode);

        // سپس این فایل را اصلی کن
        await _fileService.AttachFileAsPrimaryAsync(fileCode, EntityFile.AgriculturalProduct, productCode);

        // آپدیت زمان محصول
        var product = await _agriculturalProductRepository.FirstOrDefaultAsync(p => p.Code == productCode);
        if (product != null)
            product.UpdatedAt = DateTimeOffset.UtcNow;

        await _unitOfWork.SaveChangesAsync();

        // URL عکس اصلی جدید را برگردان
        return await _fileService.GetPrimaryFileUrlAsync(EntityFile.AgriculturalProduct, productCode)
               ?? throw new NotFoundException("عکس اصلی یافت نشد");
    }
    #endregion

    #region حذف یک عکس از محصول
    public async Task RemoveProductImageAsync(string productCode, string fileCode)
    {
        var file = await _fileRepo.FirstOrDefaultAsync(f =>
            f.Code == fileCode &&
            f.EntityCode == productCode &&
            f.EntityFile == EntityFile.AgriculturalProduct)
            ?? throw new NotFoundException("عکس یافت نشد یا متعلق به این محصول نیست");

        bool wasPrimary = file.IsPrimary;

        // حذف فیزیکی و دیتابیس از طریق FileService
        await _fileService.DeleteFileByCodeAsync(fileCode);

        // اگر عکس اصلی حذف شد → اولین عکس باقی‌مانده را اصلی کن
        if (wasPrimary)
        {
            var remainingFile = await _fileRepo.FirstOrDefaultAsync(f =>
                f.EntityCode == productCode &&
                f.EntityFile == EntityFile.AgriculturalProduct);

            if (remainingFile != null)
            {
                await _fileService.AttachFileAsPrimaryAsync(
                    remainingFile.Code,
                    EntityFile.AgriculturalProduct,
                    productCode);
            }
        }

        await _unitOfWork.SaveChangesAsync();
    }
    #endregion
}