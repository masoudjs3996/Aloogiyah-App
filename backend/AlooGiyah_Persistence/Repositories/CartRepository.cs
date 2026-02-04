using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore; 


namespace AlooGiyah_Persistence.Repositories
{
    public class CartRepository : GenericRepository<Cart>, ICartRepository
    {
        private readonly AlooGiyahDbContext _context;

        public CartRepository(AlooGiyahDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<Cart?> GetCartWithItemsAndProductsByIdAsync(Guid cartId)
        {
            return await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.AgriculturalProduct)
                .FirstOrDefaultAsync(c => c.CartId == cartId && !c.IsDeleted);
        }



    }

}
