using AlooGiyah_Application.DTOs.Cart;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface ICartQuery
{
    Task<CartDto?> GetCartAsync();
    Task<CartDto?> GetCartByIdAsync(Guid cartId);
}
