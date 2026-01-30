using AlooGiyah_Domain.Entities.Store;

namespace AlooGiyah_Domain.Interfaces;

public interface ICartRepository : IGenericRepository<Cart>
{
    Task<Cart?> GetCartWithItemsAndProductsByIdAsync(Guid cartId);
}
