using AlooGiyah_Application.DTOs.File;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Application.Interfaces.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System.Linq.Expressions;


namespace AlooGiyah_Application.Services;

public class FileService : IFileService
{
    #region Constructor

    private readonly IFileRepository _fileRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IGenericRepository<Files> _genericRepositoryfile;
    private readonly ICurrentUserService _currentUserService;
    private readonly IGenericRepository<FileType> _genericFileRepository;
    private readonly IRepositoryFactory _repositoryFactory;

    public FileService(
        IFileRepository fileRepository,
        IFileStorageService fileStorageService,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IGenericRepository<Files> genericRepositoryfile,
        IGenericRepository<FileType> genericFileRepository,
        ICurrentUserService currentUserService,
        IRepositoryFactory repositoryFactory)
    {
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
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        int user = int.Parse(_currentUserService.UserId);

        var fileType = await _genericFileRepository.GetByCodeAsync(dto.FileTypeCode);
        if (fileType == null)
            throw new AppException("FileType not found");

        if (!string.IsNullOrEmpty(dto.EntityCode))
        {
            var isValidEntity = await ValidateEntityCodeAsync(dto.EntityFile, dto.EntityCode);
            if (!isValidEntity)
                throw new AppException($"Entity with code {dto.EntityCode} not found for EntityFile {dto.EntityFile}");
        }

        if (dto.File == null || dto.File.Length == 0)
            throw new AppException("File is empty");

        // تصمیم‌گیری خودکار: آیا از پوشه تاریخ استفاده کنیم؟
        bool useDateFolder = ShouldUseDateFolder(dto.EntityFile);

        // ذخیره در storage
        string relativePath = await _fileStorageService.SaveFileAsync(
            file: dto.File,
            entityFile: dto.EntityFile,
            entityCode: dto.EntityCode,
            useDateFolder: useDateFolder
            );
    

            var fileEntity = _mapper.Map<Files>(dto);
        fileEntity.FileTypeId = fileType.FileTypeId;
        fileEntity.UserId = user;
        fileEntity.Url = relativePath;
        fileEntity.EntityFile = dto.EntityFile;
        fileEntity.EntityCode = dto.EntityCode;
        fileEntity.FileType = fileType;

        await _fileRepository.AddAsync(fileEntity);
        await _unitOfWork.SaveChangesAsync();


        var resultDto = _mapper.Map<FileDto>(fileEntity);
        return resultDto;
    }

    #endregion

    #region Delete 
    public async Task DeleteFileByCodeAsync(string fileCode)
    {
        var file = await _genericRepositoryfile.GetByCodeAsync(fileCode);
        if (file == null || file.IsDeleted)
            throw new AppException("File not found", "FILE_NOT_FOUND");

        file.IsDeleted = true;
        await _fileStorageService.DeleteFileAsync(file.Url);
        await _unitOfWork.SaveChangesAsync();
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<FileDto>> GetFilesAsync(FileFilterDto filter)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        // ساخت predicate (شرط‌ها)
        Expression<Func<Files, bool>> predicate = f => !f.IsDeleted;

        var userRole = _currentUserService.Roles.FirstOrDefault(); // نقش فعلی کاربر
        if (userRole != "Manager") //  فقط مدیر می‌تونه آدرس‌های دیگران رو ببینه
        {
            predicate = predicate.And(a => a.User.UserId == int.Parse(_currentUserService.UserId));
        }
        else if (!string.IsNullOrEmpty(filter.UserCode))
        {
            predicate = predicate.And(a => a.User.Code == filter.UserCode);
        }

        int? fileTypeId = null;
        if (!string.IsNullOrEmpty(filter.FileTypeCode))
        {
            var fileType = await _genericFileRepository.GetByCodeAsync(filter.FileTypeCode);
            if (fileType == null)
                throw new InvalidOperationException($"FileType with code {filter.FileTypeCode} does not exist.");
            fileTypeId = fileType.FileTypeId;
        }

        if (!string.IsNullOrEmpty(filter.EntityCode) && filter.EntityFile.HasValue)
        {
            var isValidEntity = await ValidateEntityCodeAsync(filter.EntityFile.Value, filter.EntityCode);
            if (!isValidEntity)
                throw new InvalidOperationException($"Entity with code {filter.EntityCode} not found for EntityFile {filter.EntityFile.Value}.");
        }




        if (fileTypeId.HasValue)
            predicate = predicate.And(f => f.FileTypeId == fileTypeId.Value);

        if (filter.EntityFile.HasValue)
            predicate = predicate.And(f => f.EntityFile == filter.EntityFile.Value);

        if (!string.IsNullOrEmpty(filter.EntityCode))
            predicate = predicate.And(f => f.EntityCode == filter.EntityCode);

        if (!string.IsNullOrEmpty(filter.SearchText))
            predicate = predicate.And(f => f.Description != null && f.Description.Contains(filter.SearchText));

        // استفاده از متد GetPagedProjectedAsync جنریک ریپازیتوری با پروجکشن
        var pagedResult = await _genericRepositoryfile.GetPagedProjectedAsync(
            filter: predicate,
            selector: f => new FileDto
            {
                FileCode = f.Code,
                Url = f.Url,
                Description = f.Description,
                CreatedAt = f.CreatedAt,
                FileTypeCode = f.FileType.Code,
                UserCode = f.User.Code
            },
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: f => f.CreatedAt
        );

        return pagedResult;
    }

    #endregion

    #region Attach File As PrimaryAsync
    public async Task AttachFileAsPrimaryAsync(string fileCode, EntityFile entityFile, string entityCode)
    {
        var file = await _genericRepositoryfile.GetByCodeAsync(fileCode);
        if (file == null || file.IsDeleted) throw new AppException("File not found or deleted");

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
        var file = await _genericRepositoryfile.FirstOrDefaultAsync(f =>
            f.EntityFile == entityFile &&
            f.EntityCode == entityCode &&
            f.IsPrimary &&
            !f.IsDeleted);

        return file?.Url;
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
            { EntityFile.Farm, async (code) => await _repositoryFactory.GetFileRepository<Farm>(entityType).ExistsAsync(e => e.Code == code) }
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
        _ => false
    };

}
