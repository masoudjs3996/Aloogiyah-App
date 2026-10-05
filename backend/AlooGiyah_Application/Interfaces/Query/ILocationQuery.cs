using AlooGiyah_Application.DTOs.Location;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface ILocationQuery
{
    Task<PagedResult<ProvinceListDto>> GetProvincesAsync(LocationFilterDto filter);
    Task<PagedResult<CountyDto>> GetCountiesAsync(string? provinceCode, LocationFilterDto filter);
    Task<List<CountyLocationItemDto>> GetCountyLocationsAsync(CountyLocationsFilterDto filter);
}
