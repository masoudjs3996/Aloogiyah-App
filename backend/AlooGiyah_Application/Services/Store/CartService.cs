using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.Cart;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AlooGiyah_Application.Services.Store;

public class CartService : ICartService
{
    private readonly ICartQuery _readQuery;

    private readonly IGenericRepository<Cart> _cartRepo;
    private readonly IGenericRepository<CartItem> _cartItemRepo;
    private readonly IGenericRepository<AgriculturalProduct> _productRepo;
    private readonly IGenericRepository<Files> _fileRepo;
    private readonly ICartRepository _cartRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPriceCalculatorService _priceCalculator;
    private readonly IMapper _mapper;

    public CartService(ICartQuery readQuery,
        
    IGenericRepository<Cart> cartRepo,
    IGenericRepository<CartItem> cartItemRepo,
    IGenericRepository<AgriculturalProduct> productRepo,
    IGenericRepository<Files> failRepo,
    ICartRepository cartRepository,
    IUnitOfWork unitOfWork,
    ICurrentUserService currentUserService,
    IPriceCalculatorService priceCalculator,
    IMapper mapper)
    {
        _readQuery = readQuery;
        _cartRepo = cartRepo;
        _cartItemRepo = cartItemRepo;
        _productRepo = productRepo;
        _fileRepo = failRepo;
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
        return await _readQuery.GetCartAsync();
    }


    #region GetCartByIdAsync
    public async Task<CartDto?> GetCartByIdAsync(Guid cartId)
    {
        return await _readQuery.GetCartByIdAsync(cartId);
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


        // Use the same read/pricing path as GET: all roles and discount relations
        // must be evaluated identically after add, update and remove.
        return await _readQuery.GetCartByIdAsync(cart.CartId)
            ?? throw new NotFoundException("سبد خرید یافت نشد");
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


        await _unitOfWork.SaveChangesAsync();

        // Use the same read/pricing path as GET: all roles and discount relations
        // must be evaluated identically after add, update and remove.
        return await _readQuery.GetCartByIdAsync(cart.CartId)
            ?? throw new NotFoundException("سبد خرید یافت نشد");
    }

    public async Task<CartDto> RemoveCartItemAsync(RemoveCartItemDto dto)
    {
        var cart = await GetCurrentCartAsync();

        var item = cart.CartItems
            .FirstOrDefault(i => i.Code == dto.ItemCode)
            ?? throw new NotFoundException("آیتم یافت نشد");

        cart.CartItems.Remove(item);
        await _cartItemRepo.DeleteAsync(item);


        await _unitOfWork.SaveChangesAsync();

        // Use the same read/pricing path as GET: all roles and discount relations
        // must be evaluated identically after add, update and remove.
        return await _readQuery.GetCartByIdAsync(cart.CartId)
            ?? throw new NotFoundException("سبد خرید یافت نشد");
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
        // استخراج کدهای منحصربه‌فرد
        var farmCodes = cart.CartItems
            .Select(i => i.AgriculturalProduct.Farm.Code)
            .Distinct()
            .ToList();

        var productCodes = cart.CartItems
            .Select(i => i.AgriculturalProduct.Code)
            .Distinct()
            .ToList();

        // دریافت تصاویر اصلی مزرعه‌ها
        var farmImages = _fileRepo.GetAll()
            .Where(f => !f.IsDeleted && f.IsPrimary &&
                        f.EntityFile == EntityFile.Farm &&
                        f.EntityCode != null && farmCodes.Contains(f.EntityCode))
            .ToDictionary(f => f.EntityCode!, f => f.Url);

        // دریافت تصاویر اصلی محصولات کشاورزی
        var productImages = _fileRepo.GetAll()
            .Where(f => !f.IsDeleted && f.IsPrimary &&
                        f.EntityFile == EntityFile.AgriculturalProduct &&
                        f.EntityCode != null && productCodes.Contains(f.EntityCode))
            .ToDictionary(f => f.EntityCode!, f => f.Url);

        return new CartDto
        {
            CartId = cart.CartId,
            Code = cart.Code,
            IsGuest = cart.UserId == null,
            Farms = cart.CartItems
           .GroupBy(i => i.AgriculturalProduct.Farm)
           .Select(g =>
           {
               var farm = g.Key;
               var address = farm.Address;
               var city = address?.City;
               var county = city?.County;
               var province = county?.Province;

               return new FarmCartDto
               {
                   FarmCode = farm.Code,
                   FarmName = farm.Name,
                   TotalPrice = g.Sum(i => i.Price),
                   ImageUrl = farmImages.GetValueOrDefault(farm.Code),
                   Province = province?.Name ?? string.Empty,   // ← نام استان
                   County = county?.Name ?? string.Empty,       // ← نام شهرستان
                   Items = g.Select(i => new CartItemDto
                   {
                       Code = i.Code,
                       ProductCode = i.AgriculturalProduct.Code,
                       ProductName = i.AgriculturalProduct.Name,
                       ProductSlug = i.AgriculturalProduct.Slug,
                       Quantity = i.Quantity,
                       UnitPrice = i.Quantity > 0 ? i.Price / i.Quantity : 0,
                       AvailableStock = i.AgriculturalProduct.Stock,
                       PrimaryImageUrl = productImages.GetValueOrDefault(i.AgriculturalProduct.Code)
                   }).ToList()
               };
           }).ToList()
        };
    }
    

    private async Task<Cart> GetCurrentCartAsync()
    {
        var query = _cartRepo.GetAll()
    .Include(c => c.CartItems)
        .ThenInclude(i => i.AgriculturalProduct)
            .ThenInclude(p => p.Farm)
                .ThenInclude(f => f.Address!)
                    .ThenInclude(a => a.City!)
                        .ThenInclude(c => c.County)
                            .ThenInclude(co => co.Province)
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