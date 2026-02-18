using AlooGiyah_Application.DTOs.AgriculturalOrderItem;
using AlooGiyah_Application.DTOs.Discount;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service
{
    public interface IDiscountService
    {
        Task<DiscountDto> CreateAsync(DiscountCreateDto dto);
        Task<bool> UpdateAsync(DiscountUpdateDto dto);
        Task<bool> DeleteAsync(string code);
        Task<DiscountDto?> GetByCodeAsync(string code);
        Task<PagedResult<DiscountDto>> GetByFilterAsync(DiscountFilterDto filter);

    }
}
