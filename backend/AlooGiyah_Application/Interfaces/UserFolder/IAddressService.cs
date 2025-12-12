using AlooGiyah_Application.DTOs.Address;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.UserFolder;

public interface IAddressService
{
    Task<PagedResult<AddressDto>> GetByFilterAsync(AddressFilterDto dto);
    Task<AddressDto?> GetByCodeAsync(string code);
    Task<AddressDto> CreateAsync(AddressCreateDto address);
    Task<AddressDto> UpdateAsync(AddressUpdateDto address);
    Task<bool> DeleteAsync(string Code);
}
