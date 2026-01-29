using AlooGiyah_Application.DTOs.Cart;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Application.Interfaces.UserFolder;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

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
        private readonly IPriceCalculatorService _priceCalculator;
        private readonly IMapper _mapper;

        public CartService(
            IGenericRepository<Cart> cartRepo,
            IGenericRepository<CartItem> cartItemRepo,
            IGenericRepository<AgriculturalProduct> productRepo,
            IUnitOfWork unitOfWork,
            ICurrentUserService currentUserService,
            IPriceCalculatorService priceCalculator,
            IMapper mapper)
        {
            _cartRepo = cartRepo;
            _cartItemRepo = cartItemRepo;
            _productRepo = productRepo;
            _unitOfWork = unitOfWork;
            _currentUserService = currentUserService;
            _priceCalculator = priceCalculator;
            _mapper = mapper;
        }
        #endregion

        private int? CurrentUserId => int.TryParse(_currentUserService.UserId, out var id) ? id : null;
        private Guid? CurrentGuestId => Guid.TryParse(_currentUserService.CartId, out var gid) && gid != Guid.Empty ? gid : null;
        private string CurrentRole => _currentUserService.Roles.FirstOrDefault() ?? "Guest";

        #region Get Carts Async
        public async Task<List<CartDto>> GetCartsAsync()
        {
            if (!CurrentUserId.HasValue && !CurrentGuestId.HasValue)
                return new List<CartDto>();

            var query = _cartRepo.GetAll()
                .Include(c => c.CartItems).ThenInclude(ci => ci.AgriculturalProduct).ThenInclude(p => p.Farm)
                .Include(c => c.Farm)
                .Where(c => !c.IsDeleted);

            if (CurrentUserId.HasValue)
            {
                query = query.Where(c => c.UserId == CurrentUserId.Value);
            }
            else if (CurrentGuestId.HasValue)
            {
                query = query.Where(c => c.GuestId == CurrentGuestId.Value);
            }
            else
            {
                return new List<CartDto>();
            }

            var carts = await query.ToListAsync();

            foreach (var cart in carts)
            {
                if (cart.CartItems.Any())
                {
                    var eligibility = cart.Discount != null
                        ? await _priceCalculator.PrepareDiscountEligibilityAsync(cart, cart.Discount)
                        : null;

                    _priceCalculator.CalculateCart(cart, CurrentRole, eligibility);
                }
            }

            return _mapper.Map<List<CartDto>>(carts);
        }
        #endregion

        #region GetCartByIdAsync
        public async Task<CartDto?> GetCartByIdAsync(Guid cartId)
        {
            var cart = await _cartRepo.GetAll()
                .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.AgriculturalProduct)
                        .ThenInclude(p => p.Farm)   // اگر نیاز به اطلاعات مزرعه داری
                .Include(c => c.Farm)
                .FirstOrDefaultAsync(c => c.CartId == cartId && !c.IsDeleted);

            if (cart == null)
            {
                return null;
            }

            // چک مالکیت - امنیت مهم است
            bool isOwner = false;

            if (CurrentUserId.HasValue)
            {
                isOwner = cart.UserId == CurrentUserId.Value;
            }
            else if (CurrentGuestId.HasValue)
            {
                isOwner = cart.GuestId == CurrentGuestId.Value;
            }

            if (!isOwner)
            {
                return null;
            }

            // محاسبه قیمت‌ها (اگر آیتم داشته باشد)
            if (cart.CartItems.Any())
            {
                var discountEligibility = cart.Discount != null
                    ? await _priceCalculator.PrepareDiscountEligibilityAsync(cart, cart.Discount)
                    : null;

                _priceCalculator.CalculateCart(cart, CurrentRole, discountEligibility);
            }

            return _mapper.Map<CartDto>(cart);
        }
        #endregion

        #region AddToCartAsync
        public async Task<CartDto> AddToCartAsync(AddToCartDto dto)
        {
            if (dto.Quantity <= 0)
                throw new InvalidOperationException("تعداد باید مثبت باشد");

            // توجه: اینجا باید با فیلد واقعی DTO شما هماهنگ شود
            // اگر DTO شما ProductCode دارد، از کد زیر استفاده کنید:
            var product = await _productRepo.GetAll()
                .Include(p => p.Farm)
                .FirstOrDefaultAsync(p => p.Code == dto.ProductCode)   // ← اینجا ProductCode فرض شده
                ?? throw new NotFoundException($"محصول با کد {dto.ProductCode} یافت نشد");

            // اگر DTO شما ProductId (int) دارد، از این خط استفاده کنید:
            // FirstOrDefaultAsync(p => p.AgriculturalProductId == dto.ProductId)

            if (product.FarmId == 0)
                throw new InvalidOperationException("محصول به مزرعه‌ای متصل نیست");

            Cart? cart = null;

            var baseQuery = _cartRepo.GetAll()
                .Include(c => c.CartItems).ThenInclude(ci => ci.AgriculturalProduct)
                .Where(c => !c.IsDeleted && c.FarmId == product.FarmId);

            if (CurrentUserId.HasValue)
            {
                cart = await baseQuery.FirstOrDefaultAsync(c => c.UserId == CurrentUserId.Value);
            }
            else if (CurrentGuestId.HasValue)
            {
                cart = await baseQuery.FirstOrDefaultAsync(c => c.GuestId == CurrentGuestId.Value);
            }

            bool isNewCart = cart == null;

            if (isNewCart)
            {
                cart = new Cart
                {
                    UserId = CurrentUserId,
                    GuestId = CurrentUserId.HasValue ? null : CurrentGuestId,
                    FarmId = product.FarmId,
                    CartItems = new List<CartItem>()
                };

                await _cartRepo.AddAsync(cart);
                await _unitOfWork.SaveChangesAsync();

                if (!CurrentUserId.HasValue && string.IsNullOrEmpty(_currentUserService.CartId))
                {
                    _currentUserService.CartId = cart.GuestId?.ToString();
                }
            }

            var existingItem = cart!.CartItems
                .FirstOrDefault(i => i.AgriculturalProductId == product.AgriculturalProductId);

            if (existingItem != null)
            {
                existingItem.Quantity += dto.Quantity;
            }
            else
            {
                cart.CartItems.Add(new CartItem
                {
                    AgriculturalProductId = product.AgriculturalProductId,
                    Quantity = dto.Quantity
                });
            }

            var eligibility = cart.Discount != null
                ? await _priceCalculator.PrepareDiscountEligibilityAsync(cart, cart.Discount)
                : null;

            _priceCalculator.CalculateCart(cart, CurrentRole, eligibility);

            await _cartRepo.UpdateAsync(cart);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<CartDto>(cart);
        }
        #endregion

        #region Update Cart Item Async
        public async Task<CartDto> UpdateCartItemAsync(UpdateCartItemDto dto)
        {
            if (dto.Quantity <= 0)
                throw new InvalidOperationException("تعداد باید مثبت باشد");

            var cart = await _cartRepo.GetAll()
                .Include(c => c.CartItems).ThenInclude(ci => ci.AgriculturalProduct)
                .FirstOrDefaultAsync(c => c.CartId == dto.CartId && !c.IsDeleted)
                ?? throw new NotFoundException("سبد خرید یافت نشد");

            // چک مالکیت
            if (CurrentUserId.HasValue && cart.UserId != CurrentUserId.Value)
                throw new UnauthorizedAccessException("این سبد متعلق به شما نیست");
            if (!CurrentUserId.HasValue && cart.GuestId != CurrentGuestId)
                throw new UnauthorizedAccessException("این سبد متعلق به شما نیست");

            var item = cart.CartItems
                .FirstOrDefault(i => i.Code == dto.ItemCode)
                ?? throw new NotFoundException("آیتم در سبد یافت نشد");

            item.Quantity = dto.Quantity;

            var eligibility = cart.Discount != null
                ? await _priceCalculator.PrepareDiscountEligibilityAsync(cart, cart.Discount)
                : null;

            _priceCalculator.CalculateCart(cart, CurrentRole, eligibility);

            await _cartRepo.UpdateAsync(cart);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<CartDto>(cart);
        }
        #endregion

        // ┌───────────────────────────────┐
        // │     Remove Cart Item          │
        // └───────────────────────────────┘
        public async Task<CartDto> RemoveCartItemAsync(RemoveCartItemDto dto)
        {
            var cart = await _cartRepo.GetAll()
                .Include(c => c.CartItems).ThenInclude(ci => ci.AgriculturalProduct)
                .FirstOrDefaultAsync(c => c.CartId == dto.CartId && !c.IsDeleted)
                ?? throw new NotFoundException("سبد خرید یافت نشد");

            // چک مالکیت
            if (CurrentUserId.HasValue && cart.UserId != CurrentUserId.Value)
                throw new UnauthorizedAccessException("این سبد متعلق به شما نیست");
            if (!CurrentUserId.HasValue && cart.GuestId != CurrentGuestId)
                throw new UnauthorizedAccessException("این سبد متعلق به شما نیست");

            var item = cart.CartItems
                .FirstOrDefault(i => i.Code == dto.ItemCode)
                ?? throw new NotFoundException("آیتم در سبد یافت نشد");

            cart.CartItems.Remove(item);
            await _cartItemRepo.DeleteAsync(item);

            var eligibility = cart.Discount != null
                ? await _priceCalculator.PrepareDiscountEligibilityAsync(cart, cart.Discount)
                : null;

            _priceCalculator.CalculateCart(cart, CurrentRole, eligibility);

            await _cartRepo.UpdateAsync(cart);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<CartDto>(cart);
        }

        // ┌───────────────────────────────┐
        // │       Clear Cart              │
        // └───────────────────────────────┘
        public async Task ClearCartAsync()
        {
            IQueryable<Cart> query = _cartRepo.GetAll().Where(c => !c.IsDeleted);

            if (CurrentUserId.HasValue)
            {
                query = query.Where(c => c.UserId == CurrentUserId.Value);
            }
            else if (CurrentGuestId.HasValue)
            {
                query = query.Where(c => c.GuestId == CurrentGuestId.Value);
            }
            else
            {
                return;
            }

            var carts = await query.ToListAsync();

            foreach (var cart in carts)
            {
                await _cartRepo.LogicalDeleteAsync(cart);
            }

            await _unitOfWork.SaveChangesAsync();

            // اگر مهمان بود، کوکی را هم پاک کن
            if (!CurrentUserId.HasValue)
            {
                _currentUserService.CartId = null;
            }
        }

        // اگر می‌خواهید Clear یک سبد خاص باشد، این نسخه را هم می‌توانید داشته باشید
        public async Task ClearCartAsync(Guid cartId)
        {
            var cart = await _cartRepo.GetAll()
                .FirstOrDefaultAsync(c => c.CartId == cartId && !c.IsDeleted)
                ?? throw new NotFoundException("سبد خرید یافت نشد");

            if (CurrentUserId.HasValue && cart.UserId != CurrentUserId.Value)
                throw new UnauthorizedAccessException("دسترسی مجاز نیست");
            if (!CurrentUserId.HasValue && cart.GuestId != CurrentGuestId)
                throw new UnauthorizedAccessException("دسترسی مجاز نیست");

            await _cartRepo.LogicalDeleteAsync(cart);
            await _unitOfWork.SaveChangesAsync();
        }

        // متد Merge (همان قبلی - بدون تغییر)
        public async Task MergeGuestCartWithUserAsync(int userId)
        {
            if (!CurrentGuestId.HasValue) return;

            var guestCarts = await _cartRepo.GetAll()
                .Include(c => c.CartItems)
                .Where(c => c.GuestId == CurrentGuestId.Value && !c.IsDeleted)
                .ToListAsync();

            if (!guestCarts.Any()) return;

            foreach (var guestCart in guestCarts)
            {
                var userCart = await _cartRepo.GetAll()
                    .Include(c => c.CartItems)
                    .FirstOrDefaultAsync(c => c.UserId == userId && c.FarmId == guestCart.FarmId && !c.IsDeleted);

                if (userCart == null)
                {
                    userCart = new Cart
                    {
                        UserId = userId,
                        FarmId = guestCart.FarmId,
                        CartItems = new List<CartItem>()
                    };
                    await _cartRepo.AddAsync(userCart);
                    await _unitOfWork.SaveChangesAsync();
                }

                foreach (var gItem in guestCart.CartItems)
                {
                    var existing = userCart.CartItems.FirstOrDefault(i => i.AgriculturalProductId == gItem.AgriculturalProductId);
                    if (existing != null)
                        existing.Quantity += gItem.Quantity;
                    else
                        userCart.CartItems.Add(new CartItem
                        {
                            AgriculturalProductId = gItem.AgriculturalProductId,
                            Quantity = gItem.Quantity
                        });
                }

                await _cartRepo.LogicalDeleteAsync(guestCart);
            }

            await _unitOfWork.SaveChangesAsync();

            _currentUserService.CartId = null;
        }
    }
}