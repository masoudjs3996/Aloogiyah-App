using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Store;

public interface IAgriculturalOrderService
{
    Task<AgriculturalOrderDto> CreateAsync(AgriculturalOrderCreateDto dto);
    Task<bool> UpdateAsync(AgriculturalOrderUpdateDto dto);
    Task<bool> DeleteAsync(string code);
    Task<AgriculturalOrderDto?> GetByCodeAsync(string code);
    Task<PagedResult<AgriculturalOrderDto>> GetByFilterAsync(AgriculturalOrderFilterDto filter);
    Task<bool> ChangeOrderStatus(string orderCode, OrderAction action);
    Task<PaymentResultDto> ProceedToPaymentAsync(string orderCode);
    Task<AgriculturalOrderDto> CreateFromCartAsync(CheckoutFromCartDto dto);
}
