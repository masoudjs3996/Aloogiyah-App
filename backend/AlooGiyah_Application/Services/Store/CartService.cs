using AlooGiyah_Application.DTOs.Cart;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Application.Interfaces.UserFolder;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AlooGiyah_Application.Services.Store;

public class CartService : ICartService
{
    private readonly IGenericRepository<Cart> _cartRepo;
    private readonly IGenericRepository<CartItem> _cartItemRepo;
    private readonly IGenericRepository<AgriculturalProduct> _productRepo;
    private readonly ICartRepository _cartRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPriceCalculatorService _priceCalculator;
    private readonly IMapper _mapper;
    public CartService(
    IGenericRepository<Cart> cartRepo,
    IGenericRepository<CartItem> cartItemRepo,
    IGenericRepository<AgriculturalProduct> productRepo,
    ICartRepository cartRepository,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService,
    IPriceCalculatorService priceCalculator,
    IMapper mapper)
    {
        _cartRepo = cartRepo;
        _cartItemRepo = cartItemRepo;
        _productRepo = productRepo;
        _cartRepository = cartRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _priceCalculator = priceCalculator;
        _mapper = mapper;
    }
    private int? CurrentUserId => int.TryParse(_currentUserService.UserId, out var id) ? id : null;
    private Guid? CurrentGuestId
    {
        get
        {
            var cartIdStr = _currentUserService.CartId;
            return Guid.TryParse(cartIdStr, out var gid) && gid != Guid.Empty ? gid : null;
        }
    }
    private string CurrentRole => _currentUserService.Roles.FirstOrDefault() ?? "Guest";

    public async Task<CartDto?> GetCartAsync()
    {
        var cartQuery = _cartRepo.GetAll()
            .Include(c => c.CartItems)
                .ThenInclude(i => i.AgriculturalProduct)
                    .ThenInclude(p => p.Farm)
            .Where(c => !c.IsDeleted);

        Cart? cart;

        if (_currentUserService.IsGuest)
        {
            var cartIdStr = _currentUserService.CartId;
            if (string.IsNullOrEmpty(cartIdStr))
                return null;

            var cartId = Guid.Parse(cartIdStr);
            cart = await cartQuery.FirstOrDefaultAsync(c => c.CartId == cartId);
        }
        else
        {
            var userId = int.Parse(_currentUserService.UserId!);
            cart = await cartQuery.FirstOrDefaultAsync(c => c.UserId == userId);
        }

        if (cart == null)
            return null;

        _priceCalculator.CalculateCart(cart, CurrentRole);

        return BuildCartDto(cart);
    }


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

    public async Task<CartDto> AddToCartAsync(AddToCartDto dto)
    {
        if (dto.Quantity <= 0)
            throw new InvalidOperationException("تعداد باید بیشتر از صفر باشد");

        var product = await _productRepo.GetAll()
            .Include(p => p.Farm)
            .FirstOrDefaultAsync(p => p.Code == dto.ProductCode)
            ?? throw new NotFoundException("محصول یافت نشد");

        var cartId = _currentUserService.IsGuest
            ? Guid.Parse(_currentUserService.CartId!)
            : Guid.Empty;

        var cartQuery = _cartRepo.GetAll()
            .Include(c => c.CartItems)
                .ThenInclude(i => i.AgriculturalProduct)
                    .ThenInclude(p => p.Farm)
            .Where(c => !c.IsDeleted);

        Cart? cart;

        if (_currentUserService.IsGuest)
        {
            cart = await cartQuery.FirstOrDefaultAsync(c => c.CartId == cartId);
        }
        else
        {
            var userId = int.Parse(_currentUserService.UserId!);
            cart = await cartQuery.FirstOrDefaultAsync(c => c.UserId == userId);
        }

        if (cart == null)
        {
            cart = new Cart
            {
                CartId = _currentUserService.IsGuest ? cartId : Guid.NewGuid(),
                UserId = _currentUserService.IsGuest ? null : int.Parse(_currentUserService.UserId!),
                CartItems = new List<CartItem>()
            };

            await _cartRepo.AddAsync(cart);
            await _unitOfWork.SaveChangesAsync();
        }

        var item = cart.CartItems
            .FirstOrDefault(i => i.AgriculturalProductId == product.AgriculturalProductId);

        if (item == null)
        {
            cart.CartItems.Add(new CartItem
            {
                CartId = cart.CartId,
                AgriculturalProductId = product.AgriculturalProductId,
                Quantity = dto.Quantity
            });
        }
        else
        {
            item.Quantity += dto.Quantity;
        }

        await _unitOfWork.SaveChangesAsync();

        _priceCalculator.CalculateCart(cart, CurrentRole);

        return BuildCartDto(cart);
    }


    public async Task<CartDto> UpdateCartItemAsync(UpdateCartItemDto dto)
    {
        if (dto.Quantity <= 0)
            throw new InvalidOperationException("تعداد باید مثبت باشد");

        var cart = await GetCurrentCartAsync();

        var item = cart.CartItems
            .FirstOrDefault(i => i.Code == dto.ItemCode)
            ?? throw new NotFoundException("آیتم یافت نشد");

        item.Quantity = dto.Quantity;

        _priceCalculator.CalculateCart(cart, CurrentRole);

        await _unitOfWork.SaveChangesAsync();

        return BuildCartDto(cart);
    }

    public async Task<CartDto> RemoveCartItemAsync(RemoveCartItemDto dto)
    {
        var cart = await GetCurrentCartAsync();

        var item = cart.CartItems
            .FirstOrDefault(i => i.Code == dto.ItemCode)
            ?? throw new NotFoundException("آیتم یافت نشد");

        cart.CartItems.Remove(item);
        await _cartItemRepo.DeleteAsync(item);

        _priceCalculator.CalculateCart(cart, CurrentRole);

        await _unitOfWork.SaveChangesAsync();

        return BuildCartDto(cart);
    }

    public async Task ClearCartAsync()
    {
        Cart cart;

        try
        {
            cart = await GetCurrentCartAsync();
        }
        catch
        {
            return;
        }

        foreach (var item in cart.CartItems.ToList())
        {
            await _cartItemRepo.DeleteAsync(item);
        }

        cart.CartItems.Clear();

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task MergeGuestCartWithUserAsync(int userId, Guid guestCartCode)
    {
    

        // ریپازیتوری مخصوص
        var guestCart = await _cartRepository.GetCartWithItemsAndProductsByIdAsync(guestCartCode);

        if (guestCart == null) return;

        var userCart = await _cartRepo.GetAll()
            .Include(c => c.CartItems)
            .ThenInclude(ci => ci.AgriculturalProduct)
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
            var uItem = userCart.CartItems.FirstOrDefault(i => i.AgriculturalProductId == gItem.AgriculturalProductId);

            if (uItem != null)
                uItem.Quantity += gItem.Quantity;
            else
                userCart.CartItems.Add(new CartItem
                {
                    AgriculturalProductId = gItem.AgriculturalProductId,
                    Quantity = gItem.Quantity,
                    Price = gItem.Price
                });
        }

        await _cartRepo.LogicalDeleteAsync(guestCart);
        await _unitOfWork.SaveChangesAsync();
    }








    private CartDto BuildCartDto(Cart cart)
    {
        return new CartDto
        {
            CartId = cart.CartId,
            Code = cart.Code,
            IsGuest = cart.UserId == null,

            Farms = cart.CartItems
                .GroupBy(i => i.AgriculturalProduct.Farm)
                .Select(g => new FarmCartDto
                {
                    FarmCode = g.Key.Code,
                    FarmName = g.Key.Name,

                    TotalPrice = g.Sum(i => i.Price),

                    Items = g.Select(i => _mapper.Map<CartItemDto>(i)).ToList()
                }).ToList()
        };
    }

    private async Task<Cart> GetCurrentCartAsync()
    {
        var query = _cartRepo.GetAll()
            .Include(c => c.CartItems)
                .ThenInclude(i => i.AgriculturalProduct)
                    .ThenInclude(p => p.Farm)
            .Where(c => !c.IsDeleted);

        Cart? cart;

        if (_currentUserService.IsGuest)
        {
            if (string.IsNullOrEmpty(_currentUserService.CartId))
                throw new UnauthorizedAccessException("توکن مهمان نامعتبر است");

            var cartId = Guid.Parse(_currentUserService.CartId);
            cart = await query.FirstOrDefaultAsync(c => c.CartId == cartId);
        }
        else
        {
            var userId = int.Parse(_currentUserService.UserId!);
            cart = await query.FirstOrDefaultAsync(c => c.UserId == userId);
        }

        return cart ?? throw new NotFoundException("سبد خرید یافت نشد");
    }



}