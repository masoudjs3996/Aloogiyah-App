using AlooGiyah_Application.DTOs.Location;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service.UserFolder;

public interface ILocationService
{
    // استان‌ها
    Task<PagedResult<ProvinceListDto>> GetProvincesAsync(LocationFilterDto filter);
    Task<ProvinceDto> CreateProvinceAsync(ProvinceCreateDto dto);
    Task<ProvinceDto> UpdateProvinceAsync(ProvinceUpdateDto dto);

    // شهرستان‌ها
    Task<PagedResult<CountyDto>> GetCountiesAsync(string? provinceCode, LocationFilterDto filter);
    Task<CountyDto> CreateCountyAsync(CountyCreateDto dto);

    // شهرها
    Task<CityDto> CreateCityAsync(CityCreateDto dto);

    // روستاها
    Task<VillageDto> CreateVillageAsync(VillageCreateDto dto);

    Task<List<CountyLocationItemDto>> GetCountyLocationsAsync(CountyLocationsFilterDto filterDto);
}