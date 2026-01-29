using AlooGiyah_Application.DTOs.Cart;

namespace AlooGiyah_Application.Interfaces.Store;

public interface ICartService
{
    Task<List<CartDto>> GetCartsAsync(); // بدون پارامتر
    Task<CartDto?> GetCartByIdAsync(Guid cartId);
    Task<CartDto> AddToCartAsync(AddToCartDto dto); // فقط ProductCode و Quantity
    Task<CartDto> UpdateCartItemAsync(UpdateCartItemDto dto);
    Task<CartDto> RemoveCartItemAsync(RemoveCartItemDto dto);
    Task MergeGuestCartWithUserAsync(int userId);
    Task ClearCartAsync();
}
