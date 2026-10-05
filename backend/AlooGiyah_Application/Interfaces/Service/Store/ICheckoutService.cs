using AlooGiyah_Application.DTOs.AgriculturalOrder;
namespace AlooGiyah_Application.Interfaces.Service.Store;
public interface ICheckoutService
{
    Task<CheckoutDto> CreateFromCartAsync(CheckoutFromCartDto dto);
    Task<CheckoutDto> GetByCodeAsync(string code);
    Task<CheckoutDto> PayWithWalletAsync(string code);
    Task ExpireAsync(string code);
    Task ExpireDueAsync();
}
