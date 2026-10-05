using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.Address;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Application.Interfaces.Service.UserFolder;


namespace AlooGiyah_Application.Services.UserFolder;

public class AddressService : IAddressService
{
    private readonly IAddressQuery _readQuery;

    #region Constructor
    private readonly IGenericRepository<Address> _addressRepo;
    private readonly IGenericRepository<Province> _provinceRepo;
    private readonly IGenericRepository<County> _countyRepo;
    private readonly IGenericRepository<City> _cityRepo;
    private readonly IGenericRepository<Village> _villageRepo;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AddressService(IAddressQuery readQuery,
        
        IGenericRepository<Address> addressRepo,
        IGenericRepository<Province> provinceRepo,
        IGenericRepository<County> countyRepo,
        IGenericRepository<City> cityRepo,
        IGenericRepository<Village> villageRepo,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _readQuery = readQuery;
        _addressRepo = addressRepo;
        _provinceRepo = provinceRepo;
        _countyRepo = countyRepo;
        _cityRepo = cityRepo;
        _villageRepo = villageRepo;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion

    private int CurrentUserId => int.Parse(_currentUser.UserId ?? throw new UnauthorizedAccessException("کاربر احراز هویت نشده"));
    private bool IsManager => _currentUser.Roles?.Contains("Manager") == true;

    public async Task<AddressDto> CreateAsync(AddressCreateDto dto)
    {
        // اعتبارسنجی وجود کدها
        var provinceId = await _provinceRepo.GetIdByCodeAsync(dto.ProvinceCode, p => p.ProvinceId)
                         ?? throw new NotFoundException("استان یافت نشد");

        var countyId = await _countyRepo.GetIdByCodeAsync(dto.CountyCode, c => c.CountyId)
                       ?? throw new NotFoundException("شهرستان یافت نشد");

        int? cityId = null;
        if (!string.IsNullOrEmpty(dto.CityCode))
        {
            cityId = await _cityRepo.GetIdByCodeAsync(dto.CityCode,c => c.CityId )
                     ?? throw new NotFoundException("شهر یافت نشد");
        }

        int? villageId = null;
        if (!string.IsNullOrEmpty(dto.VillageCode))
        {
            villageId = await _villageRepo.GetIdByCodeAsync(dto.VillageCode, v => v.VillageId)
                       ?? throw new NotFoundException("روستا یافت نشد");
        }

        var address = _mapper.Map<Address>(dto);
        address.UserId = CurrentUserId;
        address.ProvinceId = provinceId;
        address.CountyId = countyId;
        address.CityId = cityId;
        address.VillageId = villageId;

        // مدیریت آدرس پیش‌فرض
        if (dto.IsDefault)
        {
            await _addressRepo.GetAll()
                .Where(a => a.UserId == CurrentUserId && a.IsDefault && !a.IsDeleted)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.IsDefault, false));
        }

        await _addressRepo.AddAsync(address);
        await _unitOfWork.SaveChangesAsync();

        return await GetByCodeAsync(address.Code) ?? throw new NotFoundException("The saved address could not be retrieved.");
    }


public async Task<PagedResult<AddressDto>> GetByFilterAsync(AddressFilterDto filter)
{
        return await _readQuery.GetByFilterAsync(filter);
    }

public async Task<AddressDto?> GetByCodeAsync(string code)
    {
        var address = await _addressRepo.GetByCodeWithIncludeAsync(
            code,
            a => a.Province,
            a => a.County,
            a => a.City!,
            a => a.Village!,
            a => a.User
        );

        if (address == null || address.IsDeleted)
            throw new NotFoundException("آدرس یافت نشد");

        if (!IsManager && address.UserId != CurrentUserId)
            throw new UnauthorizedAccessException("دسترسی به آدرس کاربر دیگر مجاز نیست");

        return _mapper.Map<AddressDto>(address);
    }

    public async Task<AddressDto> UpdateAsync(AddressUpdateDto dto)
    {
        var address = await _addressRepo.GetByCodeAsync(dto.AddressCode)
                     ?? throw new NotFoundException("آدرس یافت نشد");

        if (!IsManager && address.UserId != CurrentUserId)
            throw new UnauthorizedAccessException();

        // اعتبارسنجی کدها
        address.ProvinceId = await _provinceRepo.GetIdByCodeAsync(dto.ProvinceCode, p => p.ProvinceId)
                             ?? throw new NotFoundException("استان یافت نشد");

        address.CountyId = await _countyRepo.GetIdByCodeAsync(dto.CountyCode, c => c.CountyId)
                           ?? throw new NotFoundException("شهرستان یافت نشد");

        address.CityId = !string.IsNullOrEmpty(dto.CityCode)
            ? await _cityRepo.GetIdByCodeAsync(dto.CityCode, c=> c.CityId)
            : null;

        address.VillageId = !string.IsNullOrEmpty(dto.VillageCode)
            ? await _villageRepo.GetIdByCodeAsync(dto.VillageCode, p => p.VillageId)
            : null;

        _mapper.Map(dto, address);

        if (dto.IsDefault && !address.IsDefault)
        {
            await _addressRepo.GetAll()
                .Where(a => a.UserId == address.UserId && a.IsDefault && a.Code != address.Code && !a.IsDeleted)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.IsDefault, false));
        }

        address.UpdatedAt = DateTimeOffset.UtcNow;
        await _addressRepo.UpdateAsync(address);
        await _unitOfWork.SaveChangesAsync();

        return await GetByCodeAsync(address.Code) ?? throw new NotFoundException("The saved address could not be retrieved.");
    }

    public async Task<bool> DeleteAsync(string code)
    {
        var address = await _addressRepo.GetByCodeAsync(code)
                     ?? throw new NotFoundException("آدرس یافت نشد");

        if (!IsManager && address.UserId != CurrentUserId)
            throw new UnauthorizedAccessException();

        await _addressRepo.LogicalDeleteAsync(address);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
}