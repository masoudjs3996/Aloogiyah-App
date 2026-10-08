using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.File;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Domain.ValueObjects;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System.Linq.Expressions;


namespace AlooGiyah_Application.Services;

public class FileService : IFileService
{
    private readonly IFileQuery _readQuery;

    #region Constructor

    private readonly IFileRepository _fileRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IGenericRepository<Files> _genericRepositoryfile;
    private readonly ICurrentUserService _currentUserService;
    private readonly IGenericRepository<FileType> _genericFileRepository;
    private readonly IRepositoryFactory _repositoryFactory;

    public FileService(IFileQuery readQuery,
        
        IFileRepository fileRepository,
        IFileStorageService fileStorageService,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IGenericRepository<Files> genericRepositoryfile,
        IGenericRepository<FileType> genericFileRepository,
        ICurrentUserService currentUserService,
        IRepositoryFactory repositoryFactory)
    {
        _readQuery = readQuery;
        _fileRepository = fileRepository;
        _fileStorageService = fileStorageService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _currentUserService = currentUserService;
        _genericFileRepository = genericFileRepository;
        _genericRepositoryfile = genericRepositoryfile;
        _repositoryFactory = repositoryFactory;
    }
    #endregion


    #region Upload File
    public async Task<FileDto> UploadFileAsync(FileUploadDto dto)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new UnauthorizedException("کاربر لاگین نیست");

        if (dto.File == null || dto.File.Length == 0)
            throw new BadRequestException("فایل خالی است.");
        var extension = Path.GetExtension(dto.File.FileName).ToLowerInvariant();
        if (dto.File.Length > 15 * 1024 * 1024 ||
            !dto.File.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ||
            extension is not ".jpg" and not ".jpeg" and not ".png" and not ".webp" and not ".gif")
            throw new BadRequestException("فقط تصویرهای JPG، PNG، WEBP یا GIF تا سقف ۱۵ مگابایت پذیرفته می‌شوند.");

        var fileType = await _genericFileRepository.GetByCodeAsync(dto.FileTypeCode)
                       ?? throw new AppException("نوع فایل یافت نشد");

        // چک اعتبار EntityCode فقط برای موجودیت‌های موجود (نه ایجاد جدید)
        if (!string.IsNullOrEmpty(dto.EntityCode) &&
            dto.EntityFile != EntityFile.AgriculturalProduct &&  // ایجاد جدید کالا
            dto.EntityFile != EntityFile.Category &&             // ایجاد جدید کتگوری
            dto.EntityFile != EntityFile.Farm)                   // ایجاد جدید مزرعه
        {
            var isValid = await ValidateEntityCodeAsync(dto.EntityFile, dto.EntityCode);
            if (!isValid)
                throw new AppException($"موجودیت با کد {dto.EntityCode} برای نوع {dto.EntityFile} یافت نشد");
        }

        if (dto.File == null || dto.File.Length == 0)
            throw new AppException("فایل خالی است");

        bool useDateFolder = ShouldUseDateFolder(dto.EntityFile);

        StoredFile storedFile = null!;

        try
        {
            storedFile = await _fileStorageService.SaveFileInternalAsync(
                dto.File,
                dto.EntityFile,
                useDateFolder);

            var fileEntity = new Files
            {
                // Code توسط BaseEntity constructor تولید میشه — دستی ست نکن!
                Url = storedFile.RelativePath,        // ← درست: RelativePath
                Description = dto.Description,
                EntityFile = dto.EntityFile,
                EntityCode = dto.EntityCode,
                FileTypeId = fileType.FileTypeId,
                UserId = int.Parse(_currentUserService.UserId),
                IsPrimary = dto.IsPrimary               // از DTO بگیر
            };

            await _fileRepository.AddAsync(fileEntity);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<FileDto>(fileEntity);
        }
        catch (Exception)
        {
            // اگر فایل فیزیکی ذخیره شده بود، پاک کن
            if (storedFile != null && System.IO.File.Exists(storedFile.PhysicalPath))
            {
                try { System.IO.File.Delete(storedFile.PhysicalPath); }
                catch { /* لاگ کن */ }
            }
            throw;
        }
    }
    #endregion

    #region Delete 
    public async Task DeleteFileByCodeAsync(string fileCode)
    {
        var file = await _genericRepositoryfile.GetByCodeAsync(fileCode);
        if (file == null || file.IsDeleted)
            throw new AppException("File not found", "FILE_NOT_FOUND");

        var userId = CurrentUserId();
        if (!IsManager && file.UserId != userId)
            throw new ForbiddenException("حذف این فایل برای شما مجاز نیست.");

        file.IsDeleted = true;
        await _fileStorageService.DeleteFileAsync(file.Url);
        await _unitOfWork.SaveChangesAsync();
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<FileDto>> GetFilesAsync(FileFilterDto filter)
    {
        return await _readQuery.GetFilesAsync(filter);
    }

    #endregion

    #region Attach File As PrimaryAsync
    public async Task AttachFileAsPrimaryAsync(string fileCode, EntityFile entityFile, string entityCode)
    {
        var file = await _genericRepositoryfile.GetByCodeAsync(fileCode);
        if (file == null || file.IsDeleted) throw new AppException("File not found or deleted");
        var userId = CurrentUserId();
        if (!IsManager && file.UserId != userId)
            throw new ForbiddenException("تغییر فایل اصلی برای شما مجاز نیست.");

        // قدیمی primary رو غیرفعال کن
        var oldPrimary = await _genericRepositoryfile.FirstOrDefaultAsync(f =>
            f.EntityFile == entityFile &&
            f.EntityCode == entityCode &&
            f.IsPrimary &&
            !f.IsDeleted);

        if (oldPrimary != null)
        {
            oldPrimary.IsPrimary = false;
            await _genericRepositoryfile.UpdateAsync(oldPrimary);
        }

        // جدید رو attach و primary کن
        file.EntityFile = entityFile;
        file.EntityCode = entityCode;
        file.IsPrimary = true;
        await _genericRepositoryfile.UpdateAsync(file);

        await _unitOfWork.SaveChangesAsync();
    }
    #endregion

    #region GetPrimaryFileUrlAsync
    public async Task<string?> GetPrimaryFileUrlAsync(EntityFile entityFile, string entityCode)
    {
        return await _readQuery.GetPrimaryFileUrlAsync(entityFile, entityCode);
    }
    #endregion

    public async Task RemovePrimaryFileAsync(EntityFile entityFile, string entityCode)
    {
        var primaryFile = await _genericRepositoryfile.FirstOrDefaultAsync(f =>
            f.EntityFile == entityFile &&
            f.EntityCode == entityCode &&
            f.IsPrimary &&
            !f.IsDeleted);

        if (primaryFile != null)
        {
            primaryFile.IsPrimary = false;
            await _genericRepositoryfile.UpdateAsync(primaryFile);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    #region برسی انتیتی کد وارد شده
    private async Task<bool> ValidateEntityCodeAsync(EntityFile entityType, string? entityCode)
    {
        if (string.IsNullOrEmpty(entityCode))
            return true;

        var repositoryMap = new Dictionary<EntityFile, Func<string, Task<bool>>>
        {
            { EntityFile.Product, async (code) => await _repositoryFactory.GetFileRepository<Product>(entityType).ExistsAsync(e => e.Code == code) },
            { EntityFile.Article, async (code) => await _repositoryFactory.GetFileRepository<Article>(entityType).ExistsAsync(e => e.Code == code) },
            { EntityFile.AgriculturalProduct, async (code) => await _repositoryFactory.GetFileRepository<AgriculturalProduct>(entityType).ExistsAsync(e => e.Code == code) },
            { EntityFile.ServiceRequest, async (code) => await _repositoryFactory.GetFileRepository<ServiceRequest>(entityType).ExistsAsync(e => e.Code == code) },
            { EntityFile.Auction, async (code) => await _repositoryFactory.GetFileRepository<Auction>(entityType).ExistsAsync(e => e.Code == code) },
            { EntityFile.Category, async (code) => await _repositoryFactory.GetFileRepository<Category>(entityType).ExistsAsync(e => e.Code == code) },
            { EntityFile.Profile, async (code) => await _repositoryFactory.GetFileRepository<User>(entityType).ExistsAsync(e => e.Code == code) },
            { EntityFile.Farm, async (code) => await _repositoryFactory.GetFileRepository<Farm>(entityType).ExistsAsync(e => e.Code == code) },
            { EntityFile.Slider, async (code) => await _repositoryFactory.GetFileRepository<Slider>(entityType).ExistsAsync(e => e.Code == code) }
        };

        if (!repositoryMap.ContainsKey(entityType))
            throw new InvalidOperationException($"EntityFile {entityType} is not supported.");

        return await repositoryMap[entityType](entityCode);
    }
    #endregion


    private bool ShouldUseDateFolder(EntityFile entityFile) => entityFile switch
    {
        EntityFile.Product => true,           // محصول: فایل زیاد → تاریخ
        EntityFile.Auction => true,           // حراجی: فایل زیاد → تاریخ
        EntityFile.AgriculturalProduct => true, // محصول کشاورزی: فایل زیاد
        EntityFile.ServiceRequest => true,    // درخواست خدمات: فایل زیاد

        EntityFile.Category => false,         // دسته‌بندی: فایل کم
        EntityFile.Article => false,          // مقاله: فایل کم
        EntityFile.Profile => false,          // پروفایل: فایل کم
        EntityFile.Farm => false,
        EntityFile.Slider => false,
        _ => false
    };

    private int CurrentUserId()
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.IsGuest || !int.TryParse(_currentUserService.UserId, out var id))
            throw new UnauthorizedException("ابتدا وارد حساب کاربری شوید.");
        return id;
    }

    private bool IsManager => _currentUserService.Roles.Contains("Manager") || _currentUserService.Roles.Contains("Admin");

}
