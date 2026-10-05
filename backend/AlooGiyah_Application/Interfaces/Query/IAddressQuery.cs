using AlooGiyah_Application.DTOs.Address;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IAddressQuery
{
    Task<AddressDto?> GetByCodeAsync(string code);
    Task<PagedResult<AddressDto>> GetByFilterAsync(AddressFilterDto filter);
}
