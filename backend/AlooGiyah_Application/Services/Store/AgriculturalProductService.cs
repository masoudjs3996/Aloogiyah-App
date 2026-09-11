using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Application.DTOs.File;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Exceptions;
using AlooGiyah_Shared.Seo;
using AutoMapper;

namespace AlooGiyah_Application.Services.Store;

public class AgriculturalProductService : IAgriculturalProductService
{
    #region Constructor
    private readonly IGenericRepository<AgriculturalProduct> _agriculturalProductRepository;
    private readonly IGenericRepository<Farm> _greenhouseRepository;
    private readonly IGenericRepository<Status> _statusRepository;
    private readonly IGenericRepository<Category> _categoryRepository;
    private readonly IGenericRepository<Files> _fileRepo;
    private readonly IAgriculturalProductQuery _productQuery;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileService _fileService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AgriculturalProductService(
        IGenericRepository<AgriculturalProduct> agriculturalProductRepository,
        IGenericRepository<Farm> greenhouseRepository,
        IGenericRepository<Status> statusRepository,
        IGenericRepository<Category> categoryRepository,
        IGenericRepository<Files> fileRepo,
        IAgriculturalProductQuery productQuery,
    IFileService fileService,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _agriculturalProductRepository = agriculturalProductRepository;
        _greenhouseRepository = greenhouseRepository;
        _statusRepository = statusRepository;
        _categoryRepository = categoryRepository;
        _fileRepo = fileRepo;
        _productQuery = productQuery;
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
        var greenhouseId = await _greenhouseRepository.GetIdByCodeAsync(dto.FarmCode, g => g.FarmId);
        if (greenhouseId == null)
            throw new NotFoundException($"گلخانه با کد {dto.FarmCode} پیدا نشد");

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
        productDto.GreenhouseCode = dto.FarmCode; // به‌جای FarmerCode
        productDto.StatusCode = dto.StatusCode;
        productDto.CategoryCodes = categories.Select(c => c.Code).ToList();

        return productDto;
    }
    #endregion

    #region ایجاد کالا همراه با عکس‌ها در یک تراکنش
    public async Task<AgriculturalProductDetailDto> CreateWithImageAsync(AgriculturalProductCreateDto dto)
    {
        if (dto == null)
            throw new BadRequestException("داده‌های ورودی خالی است");

        ITransaction? transaction = null;

        try
        {
            transaction = await _unitOfWork.BeginTransactionAsync();

            // مرحله ۱: اعتبارسنجی و ساخت کالا
            var priceErrors = new Dictionary<string, string[]>();
            if (dto.RetailPrice < 0)
                priceErrors.Add("RetailPrice", new[] { "قیمت خرده‌فروشی نمی‌تواند منفی باشد" });
            if (dto.WholesalePrice.HasValue && dto.WholesalePrice < 0)
                priceErrors.Add("WholesalePrice", new[] { "قیمت عمده‌فروشی نمی‌تواند منفی باشد" });
            if (priceErrors.Any())
                throw new ValidationException("اعتبارسنجی قیمت‌ها شکست خورد", priceErrors);

            if (dto.Stock < 0)
                throw new ValidationException("موجودی نمی‌تواند منفی باشد", new Dictionary<string, string[]>
            {
                { "Stock", new[] { "موجودی نمی‌تواند منفی باشد" } }
            });

            var farmId = await _greenhouseRepository.GetIdByCodeAsync(dto.FarmCode, g => g.FarmId)
                         ?? throw new NotFoundException($"گلخانه با کد {dto.FarmCode} پیدا نشد");

            var statusId = await _statusRepository.GetIdByCodeAsync(dto.StatusCode, s => s.StatusId)
                           ?? throw new NotFoundException($"وضعیت با کد {dto.StatusCode} پیدا نشد");

            var categories = new List<Category>();
            if (dto.CategoryCodes?.Any() ?? false)
            {
                foreach (var categoryCode in dto.CategoryCodes.Distinct())
                {
                    var category = await _categoryRepository.GetByCodeAsync(categoryCode)
                                   ?? throw new NotFoundException($"دسته‌بندی با کد {categoryCode} پیدا نشد");
                    categories.Add(category);
                }
            }

            var entity = _mapper.Map<AgriculturalProduct>(dto);
            entity.FarmId = farmId;
            entity.StatusId = statusId;
            entity.Categories = categories;

            // SEO
            entity.MetaTitle = dto.MetaTitle ?? SeoHelper.GenerateMetaTitle(dto.Name);
            entity.MetaDescription = dto.MetaDescription ?? SeoHelper.GenerateMetaDescription(dto.Name);
            entity.MetaKeywords = dto.MetaKeywords ?? SeoHelper.GenerateMetaKeywords(dto.Name);

            // Slug یکتا
            var greenhouse = await _greenhouseRepository.GetByIdAsync(farmId);
            string greenhouseName = greenhouse?.Name ?? "";
            string baseSlug = SeoHelper.GenerateSlug($"{entity.Name}-{greenhouseName}");
            string slug = baseSlug;
            int counter = 1;
            while (await _agriculturalProductRepository.ExistsAsync(p => p.Slug == slug))
            {
                slug = $"{baseSlug}-{counter++}";
            }
            entity.Slug = slug;

            await _agriculturalProductRepository.AddAsync(entity);
            await _unitOfWork.SaveChangesAsync(); // تولید Code

            // مرحله ۲: آپلود عکس‌ها
            if (dto.Images != null && dto.Images.Any(f => f.Length > 0))
            {
                var validImages = dto.Images
                    .Where(f => f.Length > 0 && f.ContentType.StartsWith("image/"))
                    .ToList();

                if (validImages.Any())
                {
                    var imageUploadDto = new AddProductImagesDto
                    {
                        ProductCode = entity.Code,
                        Files = validImages
                    };

                    var uploadedUrls = await AddProductImagesAsync(imageUploadDto);

                    if (uploadedUrls.Count == 0)
                        throw new BadRequestException("هیچ عکسی با موفقیت آپلود نشد");
                }
            }

            await transaction.CommitAsync();

            return await GetByCodeAsync(entity.Code);
        }
        catch (Exception)
        {
            if (transaction != null)
                await transaction.RollbackAsync();
            throw;
        }
        finally
        {
            if (transaction != null)
                await transaction.DisposeAsync();
        }
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
    public async Task<AgriculturalProductDetailDto> GetByCodeAsync(string code)
    {
        var role = _currentUserService.Roles.FirstOrDefault() ?? "User";

        var result = await _productQuery.GetByCodeAsync(code, role)
                     ?? throw new NotFoundException("محصول یافت نشد");

        return result;
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<AgriculturalProductListItemDto>>
      GetByFilterAsync(AgriculturalProductFilterDto filter)
    {
        var role = _currentUserService.Roles.FirstOrDefault() ?? "User";

        return await _productQuery.GetByFilterAsync(filter, role);
    }
    #endregion

    public async Task<PagedResult<AgriculturalProductSimilarDto>> GetSimilarAsync(
      AgriculturalProductSimilarFilterDto filter)
    {
        if (string.IsNullOrWhiteSpace(filter.ProductCode))
            throw new ArgumentException("ProductCode is required");

        return await _productQuery.GetSimilarAsync(filter);
    }

    #region اضافه کردن چند عکس به محصول (برای کالای موجود)
    public async Task<List<string>> AddProductImagesAsync(AddProductImagesDto dto)
    {
        var product = await _agriculturalProductRepository.FirstOrDefaultAsync(p => p.Code == dto.ProductCode && !p.IsDeleted)
                      ?? throw new NotFoundException("محصول یافت نشد");

        var uploadedUrls = new List<string>();
        int successfulUploads = 0;

        bool hasPrimary = await _fileRepo.ExistsAsync(f =>
            f.EntityCode == dto.ProductCode &&
            f.EntityFile == EntityFile.AgriculturalProduct &&
            f.IsPrimary);

        foreach (var file in dto.Files)
        {
            if (file == null || file.Length == 0)
                continue;

            if (!file.ContentType.StartsWith("image/"))
                throw new BadRequestException($"فایل {file.FileName} یک تصویر معتبر نیست");

            if (file.Length > 15 * 1024 * 1024)
                throw new BadRequestException($"حجم فایل {file.FileName} بیش از ۱۵ مگابایت است");

            var uploadDto = new FileUploadDto
            {
                File = file,
                EntityCode = dto.ProductCode,
                EntityFile = EntityFile.AgriculturalProduct,
                FileTypeCode = "CD5A1A3870",
                Description = null,
                IsPrimary = !hasPrimary  // اگر هنوز اصلی نداشت، این یکی اصلی باشه
            };

            FileDto uploadedFile;
            try
            {
                uploadedFile = await _fileService.UploadFileAsync(uploadDto);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"آپلود فایل {file.FileName} شکست خورد", ex);
            }

            if (uploadedFile == null || string.IsNullOrEmpty(uploadedFile.Url))
                throw new InvalidOperationException($"آپلود فایل {file.FileName} شکست خورد: URL تولید نشد");

            uploadedUrls.Add(uploadedFile.Url);
            successfulUploads++;

            if (!hasPrimary)
                hasPrimary = true; // فقط اولین عکس اصلی میشه
        }

        if (successfulUploads == 0)
            throw new BadRequestException("هیچ عکسی با موفقیت آپلود نشد");

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