using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.Location;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using LinqKit;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Application.Services.UserFolder;

public class LocationService : ILocationService
{
    private readonly ILocationQuery _readQuery;

    #region Constructor
    private readonly IGenericRepository<Province> _provinceRepo;
    private readonly IGenericRepository<County> _countyRepo;
    private readonly IGenericRepository<City> _cityRepo;
    private readonly IGenericRepository<Village> _villageRepo;
    private readonly IGenericRepository<Status> _statusRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public LocationService(ILocationQuery readQuery,
        
        IGenericRepository<Province> provinceRepo,
        IGenericRepository<County> countyRepo,
        IGenericRepository<City> cityRepo,
        IGenericRepository<Village> villageRepo,
        IGenericRepository<Status> statusRepo,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _readQuery = readQuery;
        _provinceRepo = provinceRepo;
        _countyRepo = countyRepo;
        _cityRepo = cityRepo;
        _villageRepo = villageRepo;
        _statusRepo = statusRepo;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion


    #region GetProvincesAsync
    public async Task<PagedResult<ProvinceListDto>> GetProvincesAsync(LocationFilterDto filter)
    {
        return await _readQuery.GetProvincesAsync(filter);
    }
    #endregion

    #region CreateProvinceAsync
    public async Task<ProvinceDto> CreateProvinceAsync(ProvinceCreateDto dto)
    {
        if (await _provinceRepo.ExistsAsync(p => EF.Functions.Like(p.Name, dto.Name.Trim()) && !p.IsDeleted))
            throw new BadRequestException("استان با این نام قبلاً ثبت شده است.");

        var statusId = await _statusRepo.GetIdByCodeAsync(dto.StatusCode, p => p.StatusId)
            ?? throw new NotFoundException("استاتوس کد اشتباه است");

        var province = _mapper.Map<Province>(dto);
        province.Name.Trim();
        province.StatusId = statusId;


        await _provinceRepo.AddAsync(province);
        await _unitOfWork.SaveChangesAsync();
        var provinceDto = _mapper.Map<ProvinceDto>(province);

        return provinceDto;
    }
    #endregion

    #region UpdateProvinceAsync
    public async Task<ProvinceDto> UpdateProvinceAsync(ProvinceUpdateDto dto)
    {
        var province = await _provinceRepo.GetByCodeAsync(dto.Code)
                       ?? throw new NotFoundException("استان یافت نشد");

        if (await _provinceRepo.ExistsAsync(p =>
            EF.Functions.Like(p.Name, dto.Name.Trim()) && p.Code != dto.Code && !p.IsDeleted))
            throw new BadRequestException("نام استان تکراری است.");

        province.Name = dto.Name.Trim();
        province.UpdatedAt = DateTimeOffset.UtcNow;

        await _provinceRepo.UpdateAsync(province);
        await _unitOfWork.SaveChangesAsync();

        var updateProvince = await _provinceRepo.GetByIdAsync(province.ProvinceId);


        return _mapper.Map<ProvinceDto>(updateProvince);
    }
    #endregion

    #region GetCountiesAsync
    public async Task<PagedResult<CountyDto>> GetCountiesAsync(string? provinceCode, LocationFilterDto filter)
    {
        return await _readQuery.GetCountiesAsync(provinceCode, filter);
    }
    #endregion

    #region CreateCountyAsync
    public async Task<CountyDto> CreateCountyAsync(CountyCreateDto dto)
    {
        var provinceId = await _provinceRepo.GetIdByCodeAsync(dto.ProvinceCode, p => p.ProvinceId)
                         ?? throw new NotFoundException("استان یافت نشد");

        var statysId = await _statusRepo.GetIdByCodeAsync(dto.StatusCode, p => p.StatusId)
                         ?? throw new NotFoundException("استاتوس کد نا معتبر");

        if (await _countyRepo.ExistsAsync(c => c.Name.Trim() == dto.Name.Trim() && c.ProvinceId == provinceId && !c.IsDeleted))
            throw new BadRequestException("شهرستان با این نام در این استان قبلاً ثبت شده است.");



        var county = _mapper.Map<County>(dto);
        county.Name.Trim();
        county.StatusId = statysId;
        county.ProvinceId = provinceId;

        await _countyRepo.AddAsync(county);
        await _unitOfWork.SaveChangesAsync();

        var countyDto = _mapper.Map<CountyDto>(county);

        return countyDto;
    }
    #endregion

    #region CreateCityAsync
    public async Task<CityDto> CreateCityAsync(CityCreateDto dto)
    {
        var countyId = await _countyRepo.GetIdByCodeAsync(dto.CountyCode, c => c.CountyId)
                       ?? throw new NotFoundException("شهرستان یافت نشد");

        var statusId = await _statusRepo.GetIdByCodeAsync(dto.StatusCode, c => c.StatusId)
            ?? throw new NotFoundException("استاتوس کد نا معتبر است");

        if (await _countyRepo.ExistsAsync(c => c.Name.Trim() == dto.Name.Trim() && c.ProvinceId == countyId && !c.IsDeleted))
            throw new BadRequestException("شهر با این نام در این شهرستان قبلاً ثبت شده است.");

        var city = _mapper.Map<City>(dto);
        city.StatusId = statusId;
        city.CountyId = countyId;
        city.Name.Trim();



        await _cityRepo.AddAsync(city);
        await _unitOfWork.SaveChangesAsync();

        var City = await _cityRepo.GetByIdAsync(city.CityId);

        var cityDto = _mapper.Map<CityDto>(City);

        return cityDto;
    }
    #endregion

    #region CreateVillageAsync
    public async Task<VillageDto> CreateVillageAsync(VillageCreateDto dto)
    {
        var countyId = await _countyRepo.GetIdByCodeAsync(dto.CountyCode, c => c.CountyId)
                       ?? throw new NotFoundException("شهرستان یافت نشد");

        var statusId = await _statusRepo.GetIdByCodeAsync(dto.StatusCode, c => c.StatusId)
            ?? throw new NotFoundException("استاتوس کد نا معتبر است");

        if (await _countyRepo.ExistsAsync(c => c.Name.Trim() == dto.Name.Trim() && c.ProvinceId == countyId && !c.IsDeleted))
            throw new BadRequestException("روستا با این نام در این شهرستان قبلاً ثبت شده است.");

        var village = _mapper.Map<Village>(dto);
        village.StatusId = statusId;
        village.CountyId = countyId;
        village.Name.Trim();

        await _villageRepo.AddAsync(village);
        await _unitOfWork.SaveChangesAsync();

        var Village = await _villageRepo.GetByIdAsync(village.VillageId);

        var villageDto = _mapper.Map<VillageDto>(Village);

        return villageDto;
    }
    #endregion

    #region GetCountyLocationsAsync
    public async Task<List<CountyLocationItemDto>> GetCountyLocationsAsync(CountyLocationsFilterDto filterDto)
    {
        return await _readQuery.GetCountyLocationsAsync(filterDto);
    }
    #endregion
}