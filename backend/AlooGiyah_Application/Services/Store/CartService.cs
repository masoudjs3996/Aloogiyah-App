using AlooGiyah_Application.DTOs.Cart;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Application.Interfaces.UserFolder;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System.Linq.Expressions;


namespace AlooGiyah_Application.Services.Store
{
    public class CartService : ICartService
    {
        #region Constructor
        private readonly IGenericRepository<Cart> _cartRepo;
        private readonly IGenericRepository<CartItem> _cartItemRepo;
        private readonly IGenericRepository<AgriculturalProduct> _productRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICurrentUserService _currentUserService;
        private readonly IMapper _mapper;

        public CartService(
            IGenericRepository<Cart> cartRepo,
            IGenericRepository<CartItem> cartItemRepo,
            IGenericRepository<AgriculturalProduct> productRepo,
            IUnitOfWork unitOfWork,
            ICurrentUserService currentUserService,
            IMapper mapper)
        {
            _cartRepo = cartRepo;
            _cartItemRepo = cartItemRepo;
            _productRepo = productRepo;
            _unitOfWork = unitOfWork;
            _currentUserService = currentUserService;
            _mapper = mapper;
        }
        #endregion


        #region GetCartAsync
        public async Task<CartDto> GetCartAsync(Guid? cartId, int? userId)
        {
            Expression<Func<Cart, bool>> filter = userId.HasValue
                ? c => c.UserId == userId.Value
                : c => c.CartId == cartId.Value;

            var paged = await _cartRepo.GetPagedProjectedAsync<Cart>(
                filter: cartId.HasValue || userId.HasValue ? filter : null,
                selector: c => c,
                pageNumber: 1,
                pageSize: 1,
                includes: new string[] { "CartItems.AgriculturalProduct" } // ThenInclude با string
            );

            var cart = paged.Items.FirstOrDefault();

            if (cart == null)
            {
                return new CartDto
                {
                    CartId = cartId ?? Guid.NewGuid(),
                    ItemCount = 0,
                    TotalPrice = 0,
                    CartItems = new List<CartItemDto>(),
                    IsGuest = !userId.HasValue
                };
            }

            // AutoMapper همه چیز رو مپ می‌کنه — فوق‌العاده تمیز!
            return _mapper.Map<CartDto>(cart);
        }
        #endregion

        #region AddToCartAsync
        public async Task<CartDto> AddToCartAsync(AddToCartDto dto)
        {
            if (dto.Quantity <= 0) throw new InvalidOperationException("تعداد باید مثبت باشد.");

            var product = await _productRepo.GetByCodeAsync(dto.ProductCode)
                          ?? throw new NotFoundException($"محصول با کد {dto.ProductCode} یافت نشد.");

            var role = _currentUserService.Roles?.FirstOrDefault() ?? "User";
            var price = role == "Wholesale" ? product.WholesalePrice : product.RetailPrice;

            if (product.Stock < dto.Quantity)
                throw new InvalidOperationException($"موجودی محصول {product.Name} کافی نیست.");

            var includes = new string[] { "CartItems" };

            // جستجو با CartId
            var cartPaged = await _cartRepo.GetPagedProjectedAsync<Cart>(
                filter: c => c.CartId == dto.CartId,
                selector: c => c,
                pageNumber: 1,
                pageSize: 1,
                includes: includes
            );

            var cart = cartPaged.Items.FirstOrDefault();

            if (cart == null)
            {
                // سبد جدید — فقط یک بار ساخته می‌شه
                cart = new Cart
                {
                    CartId = dto.CartId,
                    CartItems = new List<CartItem>()
                };
                _cartRepo.AddAsync(cart); // فقط Add، نه Update
            }
            // اگر cart وجود داشت، cart.CartItems لود شده و می‌تونیم روش کار کنیم

            var existingItem = cart.CartItems
                .FirstOrDefault(i => i.AgriculturalProductId == product.AgriculturalProductId);

            if (existingItem != null)
            {
                var totalNeeded = existingItem.Quantity + dto.Quantity;
                if (product.Stock < totalNeeded - existingItem.Quantity)
                    throw new InvalidOperationException("موجودی کافی نیست.");

                existingItem.Quantity = totalNeeded;
                existingItem.Price = price;
            }
            else
            {
                cart.CartItems.Add(new CartItem
                {
                    AgriculturalProductId = product.AgriculturalProductId,
                    Quantity = dto.Quantity,
                    Price = price
                });
            }

            // <<<--- همیشه Update بزن — EF خودش تشخیص می‌ده جدیده یا نه --->
            await _cartRepo.UpdateAsync(cart); // این خط کلیدی هست!

            await _unitOfWork.SaveChangesAsync();

            return await GetCartAsync(dto.CartId, null);
        }
        #endregion

        #region UpdateCartItemAsync
        public async Task<CartDto> UpdateCartItemAsync(UpdateCartItemDto dto)
        {
            if (dto.Quantity <= 0) throw new InvalidOperationException("تعداد باید مثبت باشد.");

            var includes = new string[] { "CartItems" };

            var cartPaged = await _cartRepo.GetPagedProjectedAsync<Cart>(
                filter: c => c.CartId == dto.CartId,
                selector: c => c,
                pageNumber: 1,
                pageSize: 1,
                includes: includes
            );

            var cart = cartPaged.Items.FirstOrDefault()
                       ?? throw new NotFoundException("سبد خرید یافت نشد");

            var item = cart.CartItems.FirstOrDefault(i => i.Code == dto.ItemCode)
                       ?? throw new NotFoundException("آیتم سبد یافت نشد.");

            var product = await _productRepo.GetByIdAsync(item.AgriculturalProductId)
                          ?? throw new NotFoundException("محصول یافت نشد");

            if (product.Stock < dto.Quantity)
                throw new InvalidOperationException($"موجودی محصول {product.Name} کافی نیست.");

            item.Quantity = dto.Quantity;
            item.Price = _currentUserService.Roles?.Contains("Wholesale") == true
                         ? product.WholesalePrice
                         : product.RetailPrice;

            cart.UpdatedAt = DateTimeOffset.UtcNow;

            await _cartRepo.UpdateAsync(cart);
            await _unitOfWork.SaveChangesAsync();

            return await GetCartAsync(dto.CartId, null);
        }
        #endregion

        #region RemoveFromCartItemAsync
        public async Task<CartDto> RemoveFromCartItemAsync(RemoveCartItemDto dto)
        {
            var includes = new string[] { "CartItems" };

            var cartPaged = await _cartRepo.GetPagedProjectedAsync<Cart>(
                filter: c => c.CartId == dto.CartId,
                selector: c => c,
                pageNumber: 1,
                pageSize: 1,
                includes: includes
            );

            var cart = cartPaged.Items.FirstOrDefault()
                       ?? throw new NotFoundException("سبد خرید یافت نشد");

            var item = cart.CartItems.FirstOrDefault(i => i.Code == dto.ItemCode)
                       ?? throw new NotFoundException("آیتم سبد یافت نشد.");

            cart.CartItems.Remove(item);
            await _cartItemRepo.DeleteAsync(item);

            cart.UpdatedAt = DateTimeOffset.UtcNow;
            await _cartRepo.UpdateAsync(cart);
            await _unitOfWork.SaveChangesAsync();

            return await GetCartAsync(dto.CartId, null);
        }
        #endregion

        #region MergeGuestWithUserAsync
        public async Task<CartDto> MergeGuestWithUserAsync(Guid guestCartId, int userId)
        {
            var includes = new string[] { "CartItems" };

            var guestPaged = await _cartRepo.GetPagedProjectedAsync<Cart>(
                filter: c => c.CartId == guestCartId,
                selector: c => c,
                pageNumber: 1,
                pageSize: 1,
                includes: includes
            );
            var guestCart = guestPaged.Items.FirstOrDefault();

            var userPaged = await _cartRepo.GetPagedProjectedAsync<Cart>(
                filter: c => c.UserId == userId,
                selector: c => c,
                pageNumber: 1,
                pageSize: 1,
                includes: includes
            );
            var userCart = userPaged.Items.FirstOrDefault();

            bool isNewUserCart = userCart == null;

            if (isNewUserCart)
            {
                userCart = new Cart
                {
                    UserId = userId,
                    CartItems = new List<CartItem>()
                };
            }

            if (guestCart != null && guestCart.CartItems.Any())
            {
                foreach (var guestItem in guestCart.CartItems)
                {
                    var userItem = userCart.CartItems
                        .FirstOrDefault(i => i.AgriculturalProductId == guestItem.AgriculturalProductId);

                    if (userItem != null)
                    {
                        userItem.Quantity += guestItem.Quantity;
                    }
                    else
                    {
                        userCart.CartItems.Add(new CartItem
                        {
                            AgriculturalProductId = guestItem.AgriculturalProductId,
                            Quantity = guestItem.Quantity,
                            Price = guestItem.Price
                        });
                    }
                }

                await _cartRepo.LogicalDeleteAsync(guestCart);
            }

            if (isNewUserCart)
            {
                await _cartRepo.AddAsync(userCart);
            }
            else
            {
                await _cartRepo.UpdateAsync(userCart);
            }

            await _unitOfWork.SaveChangesAsync();

            return await GetCartAsync(null, userId);
        }
        #endregion

        #region ClearCartAsync
        public async Task ClearCartAsync(Guid cartId)
        {
            var includes = new string[] { "CartItems" };

            var cartPaged = await _cartRepo.GetPagedProjectedAsync<Cart>(
                filter: c => c.CartId == cartId,
                selector: c => c,
                pageNumber: 1,
                pageSize: 1,
                includes: includes
            );

            var cart = cartPaged.Items.FirstOrDefault();
            if (cart == null) return;

            foreach (var item in cart.CartItems.ToList())
            {
                await _cartItemRepo.DeleteAsync(item);
            }

            await _cartRepo.LogicalDeleteAsync(cart);
            await _unitOfWork.SaveChangesAsync();
        }
        #endregion
    }
}
