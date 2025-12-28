using AlooGiyah_Application.DTOs.Cart;

namespace AlooGiyah_Application.Interfaces.Store;

public interface ICartService
{
    Task<CartDto> GetCartAsync(Guid? cartId, int? userId);
    Task<CartDto> AddToCartAsync(AddToCartDto dto);
    Task<CartDto> UpdateCartItemAsync(UpdateCartItemDto dto);
    Task<CartDto> RemoveFromCartItemAsync(RemoveCartItemDto dto);
    Task<CartDto> MergeGuestWithUserAsync(Guid guestCartId, int userId);
    Task ClearCartAsync(Guid cartId);
}
