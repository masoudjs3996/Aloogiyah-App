using AlooGiyah_Application.DTOs.Cart;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Application.Interfaces.UserFolder;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using Microsoft.AspNetCore.Http;

namespace AlooGiyah_Application.Services.Store
{
    public class CartService : ICartService
    {
        private readonly IGenericRepository<Cart> _cartRepo;
        private readonly IGenericRepository<CartItem> _cartItemRepo;
        private readonly IGenericRepository<AgriculturalProduct> _productRepo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICurrentUserService _currentUserService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IPriceCalculatorService _priceCalculatorService;
        private readonly IAuthService _authService;
        private readonly IMapper _mapper;

        public CartService(
            IGenericRepository<Cart> cartRepo,
            IGenericRepository<CartItem> cartItemRepo,
            IGenericRepository<AgriculturalProduct> productRepo,
            IUnitOfWork unitOfWork,
            ICurrentUserService currentUserService,
            IHttpContextAccessor httpContextAccessor,
            IPriceCalculatorService priceCalculatorService,
            IAuthService authService,
            IMapper mapper)
        {
            _cartRepo = cartRepo;
            _cartItemRepo = cartItemRepo;
            _productRepo = productRepo;
            _unitOfWork = unitOfWork;
            _currentUserService = currentUserService;
            _httpContextAccessor = httpContextAccessor;
            _priceCalculatorService = priceCalculatorService;
            _authService = authService;
            _mapper = mapper;
        }

        // متد اصلی: گرفتن cartId فعلی (اگر نداشت، جدید می‌سازد)
        //private Guid ResolveCartId()
        //{
        //    // اگر کاربر لاگین شده → نباید از سبد مهمان استفاده کنه
        //    if (GetCurrentUserId().HasValue)
        //    {
        //        throw new InvalidOperationException("کاربران لاگین‌شده نباید از این متد استفاده کنند.");
        //    }

        //    var claims = _currentUserService.Claims;
        //    //var cartIdClaim = claims?.FirstOrDefault(c => c.Type == "cartId")?.Value;

        //    //if (Guid.TryParse(cartIdClaim, out Guid existingCartId))
        //    //{
        //    //    return existingCartId;
        //    //}

        //    // اولین بار کاربر مهمان است → سبد جدید بساز
        //    //var newCartId = Guid.NewGuid();
        //    //var newCart = new Cart
        //    //{
        //    //    CartId = newCartId,
        //    //    CartItems = new List<CartItem>()
        //    //};

        //    // ذخیره در دیتابیس
        //    _cartRepo.AddAsync(newCart).Wait();
        //    _unitOfWork.SaveChangesAsync().Wait();

        //    // ساخت توکن مهمان جدید
        //    var guestToken = _authService.GenerateGuestToken(newCartId);

        //    // برگرداندن توکن در هدر پاسخ
        //    var context = _httpContextAccessor.HttpContext;
        //    if (context != null && !context.Response.Headers.ContainsKey("X-Guest-Token"))
        //    {
        //        context.Response.Headers.Append("X-Guest-Token", guestToken);
        //    }

        //    return newCartId;
        //}

        private int? GetCurrentUserId()
        {
            if (int.TryParse(_currentUserService.UserId, out int userId))
                return userId;
            return null;
        }
        private Guid CartId()
        {
            var cartId = _currentUserService.CartId ?? throw new InvalidOperationException("کاربر توکن مهمان ندارد یا کارت ایدی داخل آن نیست ");

            return Guid.Parse(cartId);
        }

        public async Task<CartDto> GetCartAsync()
        {

            var userId = GetCurrentUserId();

            Cart? cart;

            if (userId.HasValue)
            {
                var paged = await _cartRepo.GetPagedProjectedAsync<Cart>(
                    filter: c => c.UserId == userId.Value,
                    selector: c => c, // یا مستقیم مپ کن
                    pageNumber: 1,
                    pageSize: 1,
                    includes: new string[] { "CartItems.AgriculturalProduct" }); // <<<--- این خط کلیدی!

                cart = paged.Items.FirstOrDefault();
            }
            else
            {
                var cartId = CartId();

                var paged = await _cartRepo.GetPagedProjectedAsync(
                    filter: c => c.CartId == cartId,
                    selector: c => c,
                    pageNumber: 1,
                    pageSize: 1,
                    includes: new string[] { "CartItems.AgriculturalProduct" });

                cart = paged.Items.FirstOrDefault();
            }

            var dto = _mapper.Map<CartDto>(cart);
            //dto.IsGuest = userId == null? true : false;

            return dto;
        }

        public async Task<CartDto> AddToCartAsync(AddToCartDto dto)
        {
            if (dto.Quantity <= 0)
                throw new InvalidOperationException("تعداد باید مثبت باشد.");

            var product = await _productRepo.GetByCodeAsync(dto.ProductCode)
                ?? throw new NotFoundException("محصول یافت نشد.");

            var userId = GetCurrentUserId();
            var role = _currentUserService.Roles.ToString();

            Cart cart;
            bool isNewCart = false;

            // =============================
            // 1️⃣ دریافت یا ساخت Cart
            // =============================

            if (userId.HasValue)
            {
                cart = (await _cartRepo.GetPagedProjectedAsync<Cart>(
                    c => c.UserId == userId.Value && !c.IsDeleted,
                    c => c,
                    1, 1,
                    includes: new[] {
                "CartItems",
                "CartItems.AgriculturalProduct",
                "Discount",
                "User"
                    }))
                    .Items.FirstOrDefault();

                if (cart == null)
                {
                    cart = new Cart
                    {
                        UserId = userId.Value,
                        CartItems = new()
                    };
                    isNewCart = true;
                }
            }
            else
            {
                var cartId = CartId();

                cart = (await _cartRepo.GetPagedProjectedAsync<Cart>(
                    c => c.CartId == cartId && !c.IsDeleted,
                    c => c,
                    1, 1,
                    includes: new[] {
                "CartItems",
                "CartItems.AgriculturalProduct",
                "Discount"
                    }))
                    .Items.FirstOrDefault();

                if (cart == null)
                {
                    cart = new Cart
                    {
                        CartId = cartId,
                        CartItems = new()
                    };
                    isNewCart = true;
                }
            }

            // =============================
            // 2️⃣ اگر Cart جدید است → اول Save
            // =============================

            if (isNewCart)
            {
                await _cartRepo.AddAsync(cart);
                await _unitOfWork.SaveChangesAsync(); // 🔴 حیاتی (FK Fix)
            }

            // =============================
            // 3️⃣ اضافه / افزایش CartItem
            // =============================

            var existingItem = cart.CartItems
                .FirstOrDefault(i => i.AgriculturalProductId == product.AgriculturalProductId);

            if (existingItem != null)
            {
                existingItem.Quantity += dto.Quantity;
            }
            else
            {
                cart.CartItems.Add(new CartItem
                {
                    CartId = cart.CartId, // 🔴 FK معتبر
                    AgriculturalProductId = product.AgriculturalProductId,
                    Quantity = dto.Quantity
                });
            }

            // =============================
            // 4️⃣ Pricing
            // =============================

            Dictionary<int, bool>? eligibility = null;
            if (cart.Discount != null)
            {
                eligibility = await _priceCalculatorService
                    .PrepareDiscountEligibilityAsync(cart, cart.Discount);
            }

            _priceCalculatorService.CalculateCart(cart, role, eligibility);

            // =============================
            // 5️⃣ Save نهایی
            // =============================

            await _cartRepo.UpdateAsync(cart);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<CartDto>(cart);
        }




        public async Task<CartDto> UpdateCartItemAsync(UpdateCartItemDto dto)
        {
            var cartId = CartId();

            var paged = await _cartRepo.GetPagedWithIncludeAsync(
                filter: c => c.CartId == cartId,
                pageNumber: 1,
                pageSize: 1,
                includes: c => c.CartItems);

            var cart = paged.Items.FirstOrDefault() ?? throw new NotFoundException("سبد خرید یافت نشد.");

            var item = cart.CartItems.FirstOrDefault(i => i.Code == dto.ItemCode)
                       ?? throw new NotFoundException("آیتم یافت نشد.");

            item.Quantity = dto.Quantity;
            await _cartRepo.UpdateAsync(cart);
            await _unitOfWork.SaveChangesAsync();
            return await GetCartAsync();
        }

        public async Task<CartDto> RemoveCartItemAsync(RemoveCartItemDto dto)
        {
            var cartId = CartId();

            var paged = await _cartRepo.GetPagedWithIncludeAsync(
                filter: c => c.CartId == cartId,
                pageNumber: 1,
                pageSize: 1,
                includes: c => c.CartItems);

            var cart = paged.Items.FirstOrDefault() ?? throw new NotFoundException("سبد خرید یافت نشد.");

            var item = cart.CartItems.FirstOrDefault(i => i.Code == dto.ItemCode)
                       ?? throw new NotFoundException("آیتم یافت نشد.");

            cart.CartItems.Remove(item);
            await _cartItemRepo.DeleteAsync(item);
            await _cartRepo.UpdateAsync(cart);
            await _unitOfWork.SaveChangesAsync();
            return await GetCartAsync();
        }

        public async Task<CartDto> MergeGuestWithUserAsync(int userId, Guid guestCartId)
        {
            var guestCart = await _cartRepo.GetPagedWithIncludeAsync(
                c => c.CartId == guestCartId,
                1, 1,
                c => c.CartItems
            );
            var guest = guestCart.Items.FirstOrDefault();
            if (guest == null || !guest.CartItems.Any())
                return await GetCartAsync();

            var userPaged = await _cartRepo.GetPagedWithIncludeAsync(
                c => c.UserId == userId,
                1, 1,
                c => c.CartItems
            );

            var userCart = userPaged.Items.FirstOrDefault()
                           ?? new Cart { UserId = userId, CartItems = new List<CartItem>() };

            // Merge
            foreach (var guestItem in guest.CartItems)
            {
                var existing = userCart.CartItems.FirstOrDefault(i => i.AgriculturalProductId == guestItem.AgriculturalProductId);
                if (existing != null)
                    existing.Quantity += guestItem.Quantity;
                else
                    userCart.CartItems.Add(new CartItem
                    {
                        AgriculturalProductId = guestItem.AgriculturalProductId,
                        Quantity = guestItem.Quantity,
                        Price = guestItem.Price
                    });
            }

            await _cartRepo.LogicalDeleteAsync(guest);
            await _cartRepo.UpdateAsync(userCart);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<CartDto>(userCart);
        }


        public async Task ClearCartAsync()
        {
            var userId = GetCurrentUserId();

            if (userId.HasValue)
            {
                var paged = await _cartRepo.GetPagedAsync(filter: c => c.UserId == userId.Value, pageSize: 1);
                var cart = paged.Items.FirstOrDefault();
                if (cart != null) await _cartRepo.LogicalDeleteAsync(cart);
            }
            else
            {
                var cartId = CartId();
                var paged = await _cartRepo.GetPagedAsync(filter: c => c.CartId == cartId, pageSize: 1);
                var cart = paged.Items.FirstOrDefault();
                if (cart != null) await _cartRepo.LogicalDeleteAsync(cart);
            }

            await _unitOfWork.SaveChangesAsync();
        }

    }
}