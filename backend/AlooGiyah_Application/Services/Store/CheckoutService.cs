using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
namespace AlooGiyah_Application.Services.Store;
public class CheckoutService : ICheckoutService
{
    private readonly ICheckoutQuery _readQuery;

    #region Constructor
    private readonly IGenericRepository<Checkout> _checkouts;
    private readonly IGenericRepository<Cart> _carts;
    private readonly IGenericRepository<CartItem> _cartItems;
    private readonly IGenericRepository<Discount> _discounts;
    private readonly IGenericRepository<Status> _statuses;
    private readonly IGenericRepository<AgriculturalProduct> _products;
    private readonly IGenericRepository<AlooGiyah_Domain.Entities.UserFolder.AddressFolder.Address> _addresses;
    private readonly IGenericRepository<Wallet> _wallets;
    private readonly IGenericRepository<WalletTransaction> _walletTransactions;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;
    public CheckoutService(ICheckoutQuery readQuery,
        IGenericRepository<Checkout> checkouts, IGenericRepository<Cart> carts,
        IGenericRepository<CartItem> cartItems, IGenericRepository<Discount> discounts,
        IGenericRepository<Status> statuses, IGenericRepository<AgriculturalProduct> products,
        IGenericRepository<AlooGiyah_Domain.Entities.UserFolder.AddressFolder.Address> addresses,
        IGenericRepository<Wallet> wallets, IGenericRepository<WalletTransaction> walletTransactions,
        ICurrentUserService currentUser, IUnitOfWork unitOfWork, IMapper mapper,
        Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        _readQuery = readQuery;
        _configuration = configuration; _checkouts = checkouts; _carts = carts; _cartItems = cartItems; _discounts = discounts;
        _statuses = statuses; _products = products; _addresses = addresses; _wallets = wallets;
        _walletTransactions = walletTransactions; _currentUser = currentUser; _unitOfWork = unitOfWork; _mapper = mapper;
    }
    #endregion
    private int UserId()
    {
        if (!_currentUser.IsAuthenticated || _currentUser.IsGuest || !int.TryParse(_currentUser.UserId, out var id))
            throw new UnauthorizedException("ابتدا وارد حساب کاربری شوید.");
        return id;
    }
    private IQueryable<Checkout> Query() => _checkouts.GetAll().Include(x => x.Discount).Include(x => x.Payments)
        .Include(x => x.Orders).ThenInclude(x => x.Status)
        .Include(x => x.Orders).ThenInclude(x => x.Buyer)
        .Include(x => x.Orders).ThenInclude(x => x.Farm)
        .Include(x => x.Orders).ThenInclude(x => x.Refund)
        .Include(x => x.Orders).ThenInclude(x => x.History)
        .Include(x => x.Orders).ThenInclude(x => x.AgriculturalOrderItems);
    private CheckoutDto Map(Checkout checkout, int id)
    {
        var dto = _mapper.Map<CheckoutDto>(checkout);
        for (var i = 0; i < checkout.Orders.Count; i++)
            dto.Orders[i].AllowedActions = AgriculturalOrderPolicy.AllowedActions(checkout.Orders[i], id,
                _currentUser.Roles.Any(x => x is "Manager" or "Admin"));
        return dto;
    }
    private async Task<Status> StatusAsync(string code) => await _statuses.GetAll().SingleOrDefaultAsync(x =>
        x.Code == code && x.EntityStatus == EntityStatus.AgriculturalOrderStatus)
        ?? throw new NotFoundException("وضعیت سفارش در دیتابیس یافت نشد.");
    #region Create From Cart
    public async Task<CheckoutDto> CreateFromCartAsync(CheckoutFromCartDto dto)
    {
        var id = UserId();
        if (dto.CartId == null || dto.CartId == Guid.Empty || string.IsNullOrWhiteSpace(dto.AddressCode) ||
            string.IsNullOrWhiteSpace(dto.IdempotencyKey) || dto.IdempotencyKey.Length is < 8 or > 100)
            throw new BadRequestException("سبد، آدرس و شناسه یکتای درخواست الزامی است.");
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new
            { dto.CartId, Address = dto.AddressCode.Trim(), Discount = dto.DiscountCode?.Trim() }))));
        await using var tx = await _unitOfWork.BeginTransactionAsync(IsolationLevel.Serializable);
        var existing = await Query().SingleOrDefaultAsync(x => x.BuyerId == id && x.IdempotencyKey == dto.IdempotencyKey);
        if (existing != null)
        {
            if (existing.RequestHash != hash) throw new ConflictException("شناسه درخواست برای خرید دیگری استفاده شده است.");
            return Map(existing, id);
        }
        var active = await Query().Where(x => x.CartId == dto.CartId && !x.IsSubmitted && !x.IsPaid && !x.IsExpired).ToListAsync();
        foreach (var previous in active)
        {
            if (previous.ExpiresAt > DateTimeOffset.UtcNow)
                throw new ConflictException("این سبد یک خرید در انتظار پرداخت دارد؛ آن را پرداخت یا لغو کنید.");
            await ReleaseAsync(previous);
        }
        var cart = await _carts.GetAll().Include(x => x.User).Include(x => x.CartItems)
            .ThenInclude(x => x.AgriculturalProduct).ThenInclude(x => x.Farm).ThenInclude(x => x.Status)
            .Include(x => x.CartItems).ThenInclude(x => x.AgriculturalProduct).ThenInclude(x => x.Status)
            .Include(x => x.CartItems).ThenInclude(x => x.AgriculturalProduct).ThenInclude(x => x.Categories)
            .SingleOrDefaultAsync(x => x.CartId == dto.CartId && x.UserId == id)
            ?? throw new NotFoundException("سبد خرید یافت نشد؛ سبد مهمان باید ابتدا به حساب منتقل شود.");
        var lines = cart.CartItems.Where(x => !x.IsDeleted).OrderBy(x => x.AgriculturalProductId).ToList();
        if (lines.Count == 0) throw new BadRequestException("سبد خرید خالی است.");
        var address = await _addresses.GetAll().Include(x => x.Province).Include(x => x.County)
            .Include(x => x.City).Include(x => x.Village)
            .SingleOrDefaultAsync(x => x.Code == dto.AddressCode.Trim() && x.UserId == id)
            ?? throw new NotFoundException("آدرس یافت نشد.");
        var pending = await StatusAsync(AgriculturalOrderStatuses.PendingPayment);
        // Only explicitly configured roles receive wholesale pricing.
        var wholesaleRoles = _configuration.GetSection("Commerce:WholesaleRoles").GetChildren()
            .Select(x => x.Value).Where(x => !string.IsNullOrWhiteSpace(x)).ToList();
        var retail = !_currentUser.Roles.Any(x => wholesaleRoles.Contains(x));
        var checkout = new Checkout { BuyerId = id, CartId = cart.CartId, IdempotencyKey = dto.IdempotencyKey,
            RequestHash = hash, ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(20),
            CartSnapshotJson = JsonSerializer.Serialize(lines.ToDictionary(x => x.Code, x => x.Quantity)) };
        var eligible = new Dictionary<int, decimal>();
        var discountCode = dto.DiscountCode?.Trim();
        Discount? discount = null;
        if (discountCode != "" && (discountCode != null || cart.DiscountId.HasValue))
        {
            var discounts = _discounts.GetAll().Include(x => x.Users).Include(x => x.agriculturalProducts).Include(x => x.Categories);
            discount = discountCode != null ? await discounts.SingleOrDefaultAsync(x => x.Code == discountCode)
                : await discounts.SingleOrDefaultAsync(x => x.DiscountId == cart.DiscountId);
            var now = DateTimeOffset.UtcNow;
            if (discount == null || !discount.IsActive || discount.StartDate > now || discount.EndDate < now ||
                discount.MaxUsage.HasValue && discount.UsageCount >= discount.MaxUsage ||
                discount.Users.Count > 0 && !discount.Users.Any(x => x.UserId == id) ||
                discount.Value < 0 || discount.DiscountType == DiscountType.Percentage && discount.Value > 100 ||
                discount.MaxDiscountAmount < 0)
                throw new BadRequestException("کد تخفیف معتبر نیست.");
        }
        var grouped = lines.GroupBy(x => x.AgriculturalProduct.FarmId).OrderBy(x => x.Key).ToList();
        foreach (var group in grouped)
        {
            var farm = group.First().AgriculturalProduct.Farm;
            if (farm.IsDeleted || farm.Status.Code is not ("14ACE65804" or "49D4721587"))
                throw new BadRequestException("مزرعه در دسترس نیست.");
            var order = new AgriculturalOrder { BuyerId = id, Buyer = cart.User!, FarmId = farm.FarmId, Farm = farm,
                FarmNameSnapshot = farm.Name, AddressId = address.AddressId, StatusId = pending.StatusId, Status = pending,
                InventoryReserved = true, AgriculturalOrderItems = new(),
                AddressSnapshotJson = JsonSerializer.Serialize(new {
                    Recipient = (cart.User!.FName + " " + cart.User.LName).Trim(), cart.User.PhoneNumber,
                    Province = address.Province.Name, County = address.County.Name, City = address.City?.Name,
                    Village = address.Village?.Name, address.Street, address.PostalCode, address.Latitude, address.Longitude
                }) };
            decimal eligibleSubtotal = 0;
            foreach (var line in group)
            {
                var product = line.AgriculturalProduct;
                if (line.Quantity <= 0 || product.IsDeleted || product.Status.Code != "251BC4A57D")
                    throw new BadRequestException("محصول یا تعداد در سبد معتبر نیست.");
                if (product.Stock < line.Quantity) throw new ConflictException($"موجودی {product.Name} کافی نیست.");
                var unit = decimal.Round(retail ? product.RetailPrice : product.WholesalePrice, 2);
                if (unit < 0) throw new BadRequestException("قیمت محصول معتبر نیست.");
                product.Stock -= line.Quantity; // Atomic with checkout under serializable transaction.
                order.AgriculturalOrderItems.Add(new AgriculturalOrderItem {
                    AgriculturalProductId = product.AgriculturalProductId, Quantity = line.Quantity, Price = unit,
                    ProductCodeSnapshot = product.Code, ProductNameSnapshot = product.Name, ProductSlugSnapshot = product.Slug });
                var subtotal = unit * line.Quantity;
                order.Subtotal += subtotal;
                if (discount != null && (!discount.FarmId.HasValue || discount.FarmId == farm.FarmId) &&
                    (discount.agriculturalProducts.Count == 0 || discount.agriculturalProducts.Any(x => x.AgriculturalProductId == product.AgriculturalProductId)) &&
                    (discount.Categories.Count == 0 || product.Categories.Any(x => discount.Categories.Any(c => c.CategoryId == x.CategoryId))))
                    eligibleSubtotal += subtotal;
            }
            if (order.Subtotal < farm.MinPurchase) throw new BadRequestException($"حداقل خرید مزرعه {farm.Name} رعایت نشده است.");
            // Shipping is zero until a server-side shipping tariff is configured; never accept frontend prices.
            eligible[farm.FarmId] = eligibleSubtotal;
            checkout.Orders.Add(order);
        }
        if (discount != null)
        {
            var eligibleTotal = eligible.Values.Sum();
            if (eligibleTotal <= 0) throw new BadRequestException("محصول مشمول تخفیف در سبد وجود ندارد.");
            var discountTotal = discount.DiscountType switch {
                DiscountType.Percentage => eligibleTotal * discount.Value / 100m,
                DiscountType.Fixed => discount.Value, // Fixed once per checkout, not once per item/farm.
                _ => throw new BadRequestException("نوع تخفیف معتبر نیست.") };
            discountTotal = decimal.Round(Math.Min(eligibleTotal, Math.Min(discountTotal, discount.MaxDiscountAmount ?? decimal.MaxValue)), 2);
            var allocations = CheckoutPricing.AllocateDiscount(eligible, discountTotal);
            foreach (var order in checkout.Orders)
            {
                order.DiscountAmount = allocations[order.FarmId!.Value];
                if (order.DiscountAmount > 0) order.DiscountId = discount.DiscountId;
            }
            // UsageCount includes active reservations; expiry releases once, payment consumes once.
            discount.UsageCount++; checkout.DiscountId = discount.DiscountId; checkout.DiscountReserved = true;
        }
        foreach (var order in checkout.Orders) order.TotalPrice = order.Subtotal - order.DiscountAmount + order.ShippingAmount;
        checkout.PayableAmount = checkout.Orders.Sum(x => x.TotalPrice);
        await _checkouts.AddAsync(checkout); await _unitOfWork.SaveChangesAsync(); await tx.CommitAsync();
        return Map(checkout, id);
    }
    #endregion
    #region Get And Pay
    public async Task<CheckoutDto> GetByCodeAsync(string code)
    {
        return await _readQuery.GetByCodeAsync(code) ?? throw new NotFoundException("خرید یافت نشد.");
    }
    public async Task<CheckoutDto> PayWithWalletAsync(string code)
    {
        var id = UserId();
        await using var tx = await _unitOfWork.BeginTransactionAsync(IsolationLevel.Serializable);
        var checkout = await Query().SingleOrDefaultAsync(x => x.Code == code && x.BuyerId == id)
            ?? throw new NotFoundException("خرید یافت نشد.");
        if (checkout.IsSubmitted || checkout.IsPaid) return Map(checkout, id); // Repeat is a read, no second debit.
        if (checkout.IsExpired || checkout.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            if (!checkout.IsExpired) { await ReleaseAsync(checkout); await _unitOfWork.SaveChangesAsync(); await tx.CommitAsync(); }
            throw new ConflictException("مهلت خرید تمام شده است؛ خرید جدید بسازید.");
        }
        if (checkout.Orders.Count == 0 || checkout.PayableAmount != checkout.Orders.Sum(x => x.TotalPrice))
            throw new ConflictException("مبلغ یا سفارش‌های خرید معتبر نیست.");
        var status = await StatusAsync(AgriculturalOrderStatuses.CheckingInventory);
        var hours = 12;
        var configuredHours = _configuration["Commerce:FarmApprovalHours"];
        if (!string.IsNullOrWhiteSpace(configuredHours) && !int.TryParse(configuredHours, out hours))
            throw new ConflictException("تنظیم مهلت تأیید مزرعه معتبر نیست.");
        if (hours is < 1 or > 168) throw new ConflictException("مهلت تأیید مزرعه باید بین ۱ و ۱۶۸ ساعت باشد.");
        var now = DateTimeOffset.UtcNow;
        var reference = "HOLD_" + checkout.Code;
        if (checkout.PayableAmount > 0)
        {
            var wallet = await _wallets.GetAll().SingleOrDefaultAsync(x => x.UserId == id)
                ?? throw new BadRequestException("کیف پول یافت نشد.");
            if (wallet.Balance - wallet.HeldAmount < checkout.PayableAmount)
                throw new BadRequestException("موجودی آزاد کیف پول کافی نیست.");
            wallet.HeldAmount += checkout.PayableAmount; // Balance changes only when each farm approves.
            await _walletTransactions.AddAsync(new WalletTransaction { WalletId = wallet.WalletId,
                Amount = checkout.PayableAmount, TransactionType = WalletTransactionType.Hold,
                ReferenceId = reference, Description = "رزرو وجه خرید " + checkout.Code });
        }
        checkout.Payments.Add(new CheckoutPayment { Amount = checkout.PayableAmount,
            Reference = reference, Method = checkout.PayableAmount == 0 ? "FreeHold" : "WalletHold", ConfirmedAt = DateTimeOffset.UtcNow });
        foreach (var order in checkout.Orders)
        {
            var previous = order.Status.Code;
            order.IsPaid = false; order.IsHeld = true; order.HeldAmount = order.TotalPrice;
            order.ApprovalExpiresAt = now.AddHours(hours); order.PaymentDate = null; order.PaymentReference = null;
            order.StatusId = status.StatusId; order.Status = status; order.Version = Guid.NewGuid();
            order.History.Add(new AgriculturalOrderHistory { ActorId = id, Action = "FundsHeld",
                FromStatusCode = previous, ToStatusCode = status.Code });
        }
        checkout.IsSubmitted = true; checkout.IsPaid = false; checkout.DiscountReserved = false; checkout.Version = Guid.NewGuid();
        // Remove only unchanged captured lines, never the user's entire current cart.
        var snapshot = JsonSerializer.Deserialize<Dictionary<string, int>>(checkout.CartSnapshotJson)!;
        var codes = snapshot.Keys.ToList();
        var cartItems = await _cartItems.GetAll().Where(x => x.CartId == checkout.CartId && codes.Contains(x.Code)).ToListAsync();
        foreach (var item in cartItems)
            if (snapshot[item.Code] == item.Quantity) await _cartItems.DeleteAsync(item);
        await _unitOfWork.SaveChangesAsync(); await tx.CommitAsync(); return Map(checkout, id);
    }
    #endregion
    #region Expiry
    public async Task ExpireAsync(string code)
    {
        var id = UserId();
        await using var tx = await _unitOfWork.BeginTransactionAsync(IsolationLevel.Serializable);
        var checkout = await Query().SingleOrDefaultAsync(x => x.Code == code && x.BuyerId == id)
            ?? throw new NotFoundException("خرید یافت نشد.");
        if (checkout.IsSubmitted || checkout.IsPaid) throw new BadRequestException("خرید پرداخت‌شده قابل لغو نیست.");
        if (!checkout.IsExpired) { await ReleaseAsync(checkout, id, "CheckoutCancelled"); await _unitOfWork.SaveChangesAsync(); }
        await tx.CommitAsync();
    }
    public async Task ExpireDueAsync()
    {
        var codes = await _checkouts.GetAll().AsNoTracking().Where(x => !x.IsSubmitted && !x.IsPaid && !x.IsExpired && x.ExpiresAt <= DateTimeOffset.UtcNow)
            .OrderBy(x => x.ExpiresAt).Select(x => x.Code).Take(100).ToListAsync();
        foreach (var code in codes)
        {
            await using var tx = await _unitOfWork.BeginTransactionAsync(IsolationLevel.Serializable);
            var checkout = await Query().SingleOrDefaultAsync(x => x.Code == code);
            if (checkout != null && !checkout.IsSubmitted && !checkout.IsPaid && !checkout.IsExpired && checkout.ExpiresAt <= DateTimeOffset.UtcNow)
            { await ReleaseAsync(checkout); await _unitOfWork.SaveChangesAsync(); }
            await tx.CommitAsync();
        }
    }
    private async Task ReleaseAsync(Checkout checkout, int? actorId = null, string action = "CheckoutExpired")
    {
        var status = await StatusAsync(AgriculturalOrderStatuses.PaymentFailed);
        foreach (var order in checkout.Orders.OrderBy(x => x.FarmId))
        {
            if (order.InventoryReserved)
            {
                foreach (var item in order.AgriculturalOrderItems.OrderBy(x => x.AgriculturalProductId))
                {
                    var product = await _products.GetAllIncludingDeleted().SingleOrDefaultAsync(x => x.AgriculturalProductId == item.AgriculturalProductId)
                        ?? throw new ConflictException("محصول رزروشده حذف شده است؛ بررسی مدیریت لازم است.");
                    product.Stock = checked(product.Stock + item.Quantity);
                }
                order.InventoryReserved = false;
            }
            order.History.Add(new AgriculturalOrderHistory { ActorId = actorId, Action = action,
                FromStatusCode = order.Status.Code, ToStatusCode = status.Code });
            order.StatusId = status.StatusId; order.Status = status; order.Version = Guid.NewGuid();
        }
        if (checkout.DiscountReserved && checkout.Discount != null)
        {
            checkout.Discount.UsageCount = Math.Max(0, checkout.Discount.UsageCount - 1);
            checkout.DiscountReserved = false;
        }
        checkout.IsExpired = true; checkout.Version = Guid.NewGuid();
    }
    #endregion
}
