using AlooGiyah_Application.DTOs.Address;
using AlooGiyah_Application.DTOs.Farm;
using AlooGiyah_Application.DTOs.File;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Application.Interfaces.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using LinqKit;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace AlooGiyah_Application.Services.Store;

public class FarmService : IFarmService
{
    private readonly IGenericRepository<Farm> _farmRepository;
    private readonly IGenericRepository<Address> _addressRepository;
    private readonly IGenericRepository<User> _userRepository;
    private readonly IGenericRepository<Province> _provinceRepo;
    private readonly IGenericRepository<County> _countyRepo;
    private readonly IGenericRepository<City> _cityRepo;
    private readonly IGenericRepository<Village> _villageRepo;
    private readonly IGenericRepository<Files> _fileRepo;
    private readonly IFileService _fileService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public FarmService(
        IGenericRepository<Farm> farmRepository,
        IGenericRepository<Address> addressRepository,
        IGenericRepository<User> userRepository,
        IGenericRepository<Province> provinceRepo,
        IGenericRepository<County> countyRepo,
        IGenericRepository<City> cityRepo,
        IGenericRepository<Village> villageRepo,
        IGenericRepository<Files> fileRepo,
    IFileService fileService,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _farmRepository = farmRepository;
        _addressRepository = addressRepository;
        _userRepository = userRepository;
        _provinceRepo = provinceRepo;
        _countyRepo = countyRepo;
        _cityRepo = cityRepo;
        _villageRepo = villageRepo;
        _fileRepo = fileRepo;
        _fileService = fileService;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    private int CurrentUserId => int.Parse(_currentUserService.UserId ?? throw new UnauthorizedException("کاربر لاگین نکرده"));

    #region ایجاد مزرعه همراه با عکس (در یک تراکنش)
    public async Task<FarmDto> CreateWithImageAsync(FarmCreateDto dto)
    {
        ITransaction? transaction = null;

        try
        {
            transaction = await _unitOfWork.BeginTransactionAsync();

            // مرحله ۱: اعتبارسنجی پایه
            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new BadRequestException("نام مزرعه الزامی است");

            if (dto.MinPurchase < 0)
                throw new BadRequestException("حداقل خرید نمی‌تواند منفی باشد");

            int currentUserId = int.Parse(_currentUserService.UserId ?? throw new UnauthorizedException("کاربر لاگین نیست"));

            // گرفتن صاحب مزرعه (فرض می‌کنیم صاحب = کاربر فعلی)
            var owner = await _userRepository.GetByIdAsync(currentUserId)
                        ?? throw new NotFoundException("کاربر یافت نشد");

            // مرحله ۲: ساخت آدرس (اگر فرستاده شده)
            Address? addressEntity = null;
            if (dto.Address != null)
            {
                // Province — الزامی
                var provinceId = await _provinceRepo.GetIdByCodeAsync(dto.Address.ProvinceCode, p => p.ProvinceId)
                                 ?? throw new BadRequestException("کد استان معتبر نیست");

                // County — اختیاری
                int? countyId = null;
                if (!string.IsNullOrEmpty(dto.Address.CountyCode))
                {
                    countyId = await _countyRepo.GetIdByCodeAsync(dto.Address.CountyCode, c => c.CountyId)
                               ?? throw new BadRequestException("کد شهرستان معتبر نیست");
                }

                // City — اختیاری
                int? cityId = null;
                if (!string.IsNullOrEmpty(dto.Address.CityCode))
                {
                    cityId = await _cityRepo.GetIdByCodeAsync(dto.Address.CityCode, c => c.CityId)
                             ?? throw new BadRequestException("کد شهر معتبر نیست");
                }

                // Village — اختیاری
                int? villageId = null;
                if (!string.IsNullOrEmpty(dto.Address.VillageCode))
                {
                    villageId = await _villageRepo.GetIdByCodeAsync(dto.Address.VillageCode, v => v.VillageId)
                                ?? throw new BadRequestException("کد روستا معتبر نیست");
                }

                addressEntity = new Address
                {
                    Street = dto.Address.Street ?? string.Empty,
                    PostalCode = dto.Address.PostalCode ?? string.Empty,
                    IsDefault = false,
                    ProvinceId = provinceId,
                    CountyId = countyId.Value,     // null اگر نفرستاده شده
                    CityId = cityId,
                    VillageId = villageId,
                    UserId = currentUserId,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                await _addressRepository.AddAsync(addressEntity);
                await _unitOfWork.SaveChangesAsync();
            }

            // مرحله ۳: ساخت مزرعه
            var farmEntity = _mapper.Map<Farm>(dto);
            farmEntity.OwnerId = currentUserId; // یا owner.UserId
            farmEntity.AddressId = addressEntity?.AddressId;

            await _farmRepository.AddAsync(farmEntity);
            await _unitOfWork.SaveChangesAsync(); // تولید Code

            // مرحله ۴: آپلود عکس (اگر فرستاده شده)
            if (dto.Image != null && dto.Image.Length > 0)
            {
                if (!dto.Image.ContentType.StartsWith("image/"))
                    throw new BadRequestException("فایل ارسالی تصویر معتبر نیست");

                if (dto.Image.Length > 15 * 1024 * 1024)
                    throw new BadRequestException("حجم عکس بیش از ۱۵ مگابایت است");

                var uploadDto = new FileUploadDto
                {
                    File = dto.Image,
                    EntityCode = farmEntity.Code,
                    EntityFile = EntityFile.Farm,
                    FileTypeCode = "CD5A1A3870",
                    Description = "عکس اصلی مزرعه",
                    IsPrimary = true  // ← چون فقط یک عکس داریم، اصلی باشه
                };

                var uploadedFile = await _fileService.UploadFileAsync(uploadDto);

                if (string.IsNullOrEmpty(uploadedFile.Url))
                    throw new InvalidOperationException("آپلود عکس مزرعه شکست خورد");
            }

            await transaction.CommitAsync();

            // برگرداندن نتیجه
            var result = _mapper.Map<FarmDto>(farmEntity);
            result.OwnerCode = owner.Code;
            result.ImageUrl = await _fileService.GetPrimaryFileUrlAsync(EntityFile.Farm, farmEntity.Code)
                              ?? "/images/default-farm.jpg";

            return result;
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
    public async Task<FarmDto?> UpdateAsync(FarmUpdateDto dto)
    {
        var farm = await _farmRepository.GetByCodeWithIncludeAsync(
            dto.Code,
            f => f.Owner!,
            f => f.Address!.Province!,
            f => f.Address!.County!,
            f => f.Address!.City!,
            f => f.Address!.Village!
        ) ?? throw new NotFoundException("مزرعه یافت نشد");

        if (farm.OwnerId != CurrentUserId)
            throw new ForbiddenException("دسترسی ممنوع");

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            _mapper.Map(dto, farm);

            if (dto.Address != null)
            {
                if (farm.Address == null)
                {
                    // ساخت آدرس جدید
                    var provinceId = await _provinceRepo.GetIdByCodeAsync(dto.Address.ProvinceCode, p => p.ProvinceId)
                                     ?? throw new NotFoundException("استان یافت نشد");
                    var countyId = await _countyRepo.GetIdByCodeAsync(dto.Address.CountyCode, c => c.CountyId)
                                   ?? throw new NotFoundException("شهرستان یافت نشد");

                    var newAddress = new Address
                    {
                        UserId = CurrentUserId,
                        Street = dto.Address.Street,
                        PostalCode = dto.Address.PostalCode,
                        Latitude = dto.Address.Latitude,
                        Longitude = dto.Address.Longitude,
                        IsDefault = dto.Address.IsDefault,
                        ProvinceId = provinceId,
                        CountyId = countyId,
                        CityId = !string.IsNullOrEmpty(dto.Address.CityCode)
                            ? await _cityRepo.GetIdByCodeAsync(dto.Address.CityCode, c => c.CityId)
                            : null,
                        VillageId = !string.IsNullOrEmpty(dto.Address.VillageCode)
                            ? await _villageRepo.GetIdByCodeAsync(dto.Address.VillageCode, v => v.VillageId)
                            : null
                    };

                    await _addressRepository.AddAsync(newAddress);
                    farm.Address = newAddress;
                }
                else
                {
                    // آپدیت آدرس موجود
                    farm.Address.ProvinceId = await _provinceRepo.GetIdByCodeAsync(dto.Address.ProvinceCode, p => p.ProvinceId)
                                              ?? throw new NotFoundException("استان یافت نشد");
                    farm.Address.CountyId = await _countyRepo.GetIdByCodeAsync(dto.Address.CountyCode, c => c.CountyId)
                                            ?? throw new NotFoundException("شهرستان یافت نشد");

                    farm.Address.CityId = !string.IsNullOrEmpty(dto.Address.CityCode)
                        ? await _cityRepo.GetIdByCodeAsync(dto.Address.CityCode, c => c.CityId)
                        : null;

                    farm.Address.VillageId = !string.IsNullOrEmpty(dto.Address.VillageCode)
                        ? await _villageRepo.GetIdByCodeAsync(dto.Address.VillageCode, v => v.VillageId)
                        : null;

                    farm.Address.Street = dto.Address.Street;
                    farm.Address.PostalCode = dto.Address.PostalCode;
                    farm.Address.Latitude = dto.Address.Latitude;
                    farm.Address.Longitude = dto.Address.Longitude;
                    farm.Address.IsDefault = dto.Address.IsDefault;
                }
            }

            farm.UpdatedAt = DateTimeOffset.UtcNow;
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            var result = _mapper.Map<FarmDto>(farm);
            result.OwnerCode = farm.Owner.Code;
            result.ImageUrl = await _fileService.GetPrimaryFileUrlAsync(EntityFile.Farm, farm.Code);

            if (result.Address != null)
            {
                result.Address.UserCode = farm.Owner.Code;
                result.Address.ProvinceCode = farm.Address.Province.Code;
                result.Address.ProvinceName = farm.Address.Province.Name;
                result.Address.CountyCode = farm.Address.County.Code;
                result.Address.CountyName = farm.Address.County.Name;
                result.Address.CityCode = farm.Address.City?.Code;
                result.Address.CityName = farm.Address.City?.Name;
                result.Address.VillageCode = farm.Address.Village?.Code;
                result.Address.VillageName = farm.Address.Village?.Name;
            }

            return result;
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    #endregion

    #region تغییر عکس مزرعه — عکس قبلی پاک میشه
    public async Task<string> ChangeFarmImageAsync(UploadFarmImageDto dto)
    {
        var farm = await _farmRepository.FirstOrDefaultAsync(f => f.Code == dto.Code && !f.IsDeleted)
                   ?? throw new NotFoundException("مزرعه یافت نشد");

        if (dto.File == null || dto.File.Length == 0)
            throw new BadRequestException("فایل عکس الزامی است");

        if (!dto.File.ContentType.StartsWith("image/"))
            throw new BadRequestException("فایل ارسالی تصویر معتبر نیست");

        if (dto.File.Length > 15 * 1024 * 1024)
            throw new BadRequestException("حجم عکس بیش از ۱۵ مگابایت است");

        ITransaction? transaction = null;

        try
        {
            transaction = await _unitOfWork.BeginTransactionAsync();

            // گرفتن عکس قبلی
            var oldFile = await _fileRepo.FirstOrDefaultAsync(f =>
                f.EntityCode == dto.Code &&
                f.EntityFile == EntityFile.Farm &&
                f.IsPrimary);

            // آپلود عکس جدید
            var uploadDto = new FileUploadDto
            {
                File = dto.File,
                EntityCode = dto.Code,
                EntityFile = EntityFile.Farm,
                FileTypeCode = "CD5A1A3870",
                Description = "عکس اصلی مزرعه",
                IsPrimary = true
            };

            var newFile = await _fileService.UploadFileAsync(uploadDto);

            if (string.IsNullOrEmpty(newFile.Url))
                throw new InvalidOperationException("آپلود عکس جدید شکست خورد");

            // حذف عکس قبلی اگر وجود داشت
            if (oldFile != null)
            {
                await _fileService.DeleteFileByCodeAsync(oldFile.Code);
            }

            farm.UpdatedAt = DateTimeOffset.UtcNow;
            await _unitOfWork.SaveChangesAsync();

            await transaction.CommitAsync();

            return newFile.Url;
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

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var farm = await _farmRepository.GetByCodeAsync(code);
        if (farm == null) return false;

        if (farm.OwnerId != CurrentUserId)
            throw new ForbiddenException("دسترسی ممنوع");

        if (farm.Address != null)
            await _addressRepository.LogicalDeleteAsync(farm.Address);

        await _farmRepository.LogicalDeleteAsync(farm);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region GetByCode
    public async Task<FarmDto?> GetByCodeAsync(string code)
    {
        var farm = await _farmRepository.GetByCodeWithIncludeAsync(
            code,
            f => f.Owner!,
            f => f.Address!.Province!,
            f => f.Address!.County!,
            f => f.Address!.City!,
            f => f.Address!.Village!
        );

        if (farm == null || farm.IsDeleted) return null;

        var dto = _mapper.Map<FarmDto>(farm);
        dto.OwnerCode = farm.Owner.Code;
        dto.ImageUrl = await _fileService.GetPrimaryFileUrlAsync(EntityFile.Farm, code);

        if (dto.Address != null)
        {
            dto.Address.UserCode = farm.Owner.Code;
            dto.Address.ProvinceCode = farm.Address.Province.Code;
            dto.Address.ProvinceName = farm.Address.Province.Name;
            dto.Address.CountyCode = farm.Address.County.Code;
            dto.Address.CountyName = farm.Address.County.Name;
            dto.Address.CityCode = farm.Address.City?.Code;
            dto.Address.CityName = farm.Address.City?.Name;
            dto.Address.VillageCode = farm.Address.Village?.Code;
            dto.Address.VillageName = farm.Address.Village?.Name;
        }

        return dto;
    }
    #endregion

    public async Task<PagedResult<MyFarmlistDto>> GetMyFarmsAsync(GetMyFarmDto filter)
    {
        var predicate = LinqKit.PredicateBuilder.True<Farm>()
            .And(f => !f.IsDeleted)
            .And(f => f.OwnerId == CurrentUserId);

        if (!string.IsNullOrWhiteSpace(filter.Name))
            predicate = predicate.And(f => f.Name.Contains(filter.Name));

        var result = await _farmRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: f => new MyFarmlistDto
            {
                Code = f.Code,
                Name = f.Name,
                Description = f.Description,
            },
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: f => f.CreatedAt

        );

        return result;
    }

    public async Task<PagedResult<FarmDto>> GetByFilterAsync(FarmFilterDto filter)
    {
        var predicate = LinqKit.PredicateBuilder.True<Farm>()
            .And(f => !f.IsDeleted);

        if (!string.IsNullOrWhiteSpace(filter.UserCode))
        {
            predicate = predicate.And(f => f.Owner.Code == filter.UserCode);
        }

        if (!string.IsNullOrWhiteSpace(filter.Name))
            predicate = predicate.And(f => f.Name.Contains(filter.Name));

        var result = await _farmRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: f => new FarmDto
            {
                Code = f.Code,
                Name = f.Name,
                Description = f.Description,
                Capacity = f.Capacity,
                MinPurchase = f.MinPurchase,
                OwnerCode = f.Owner.Code,
                CreatedAt = f.CreatedAt,
                Address = f.Address != null ? new AddressDto
                {
                    Code = f.Address.Code,
                    Street = f.Address.Street,
                    PostalCode = f.Address.PostalCode,
                    Latitude = f.Address.Latitude,
                    Longitude = f.Address.Longitude,
                    IsDefault = f.Address.IsDefault,
                    ProvinceCode = f.Address.Province.Code,
                    ProvinceName = f.Address.Province.Name,
                    CountyCode = f.Address.County.Code,
                    CountyName = f.Address.County.Name,
                    CityCode = f.Address.City != null ? f.Address.City.Code : null,
                    CityName = f.Address.City != null ? f.Address.City.Name : null,
                    VillageCode = f.Address.Village != null ? f.Address.Village.Code : null,
                    VillageName = f.Address.Village != null ? f.Address.Village.Name : null
                } : null
            },
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: f => f.CreatedAt,
            expressionIncludes: new Expression<Func<Farm, object>>[]
            {
            f => f.Owner!,
            f => f.Address!.Province!,
            f => f.Address!.County!,
            f => f.Address!.City!,
            f => f.Address!.Village!
            }
        );

        foreach (var item in result.Items)
            item.ImageUrl = await _fileService.GetPrimaryFileUrlAsync(EntityFile.Farm, item.Code);

        return result;
    }
}