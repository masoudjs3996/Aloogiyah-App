using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Application.Interfaces.Service;
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
    private readonly IGenericRepository<DeliveryBooking>? _deliveryBookings;
    private readonly IGenericRepository<DeliveryPoint>? _deliveryPoints;
    private readonly IGenericRepository<DeliveryRoute>? _deliveryRoutes;
    private readonly IGenericRepository<Category>? _deliveryCategories;
    private readonly IGenericRepository<Cart> _carts;
    private readonly IGenericRepository<CartItem> _cartItems;
    private readonly IGenericRepository<Discount> _discounts;
    private readonly IGenericRepository<Status> _statuses;
    private readonly IGenericRepository<AgriculturalProduct> _products;
    private readonly IGenericRepository<AlooGiyah_Domain.Entities.UserFolder.AddressFolder.Address> _addresses;
    private readonly IGenericRepository<Wallet> _wallets;
    private readonly IGenericRepository<WalletTransaction> _walletTransactions;
    private readonly INotificationWriter _notificationWriter;
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
        INotificationWriter notificationWriter,
        ICurrentUserService currentUser, IUnitOfWork unitOfWork, IMapper mapper,
        Microsoft.Extensions.Configuration.IConfiguration configuration, IGenericRepository<DeliveryBooking>? deliveryBookings = null, IGenericRepository<DeliveryPoint>? deliveryPoints = null, IGenericRepository<DeliveryRoute>? deliveryRoutes = null, IGenericRepository<Category>? deliveryCategories = null)
    {
        _deliveryBookings = deliveryBookings;
        _deliveryPoints = deliveryPoints; _deliveryRoutes = deliveryRoutes; _deliveryCategories = deliveryCategories;
        _readQuery = readQuery;
        _configuration = configuration; _checkouts = checkouts; _carts = carts; _cartItems = cartItems; _discounts = discounts;
        _statuses = statuses; _products = products; _addresses = addresses; _wallets = wallets;
        _walletTransactions = walletTransactions; _notificationWriter = notificationWriter;
        _currentUser = currentUser; _unitOfWork = unitOfWork; _mapper = mapper;
    }
    #endregion
    private int UserId()
    {
        if (!_currentUser.IsAuthenticated || _currentUser.IsGuest || !int.TryParse(_currentUser.UserId, out var id))
            throw new UnauthorizedException("ابتدا وارد حساب کاربری شوید.");
        return id;
    }
    private IQueryable<Checkout> Query() => _checkouts.GetAll().Include(x => x.Discount).Include(x => x.Payments)
        .Include(x => x.DeliveryBooking)
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
    private static void ValidateDiscount(Discount? discount, int id)
    {
        var now = DateTimeOffset.UtcNow;
        if (discount != null && discount.FundingSource == null)
            throw new BadRequestException("منبع تأمین این کد قدیمی باید ابتدا توسط مدیریت مشخص شود.");
        if (discount == null || discount.ForQualityAssessment || !discount.IsActive || discount.StartDate > now || discount.EndDate < now ||
            discount.MaxUsage.HasValue && discount.UsageCount >= discount.MaxUsage ||
            discount.Users.Count > 0 && !discount.Users.Any(x => x.UserId == id) ||
            discount.FundingSource is not ("Platform" or "Seller") ||
            (discount.FundingSource == "Seller") != discount.IssuerSellerId.HasValue ||
            discount.IssuerSellerId.HasValue && !discount.FarmId.HasValue ||
            discount.Value < 0 || discount.DiscountType == DiscountType.Percentage && discount.Value > 100 ||
            discount.MaxDiscountAmount < 0)
            throw new BadRequestException("کد تخفیف معتبر نیست.");
    }
    private static bool EligibleForDiscount(AgriculturalProduct product, Discount discount) =>
        (!discount.IssuerSellerId.HasValue || product.Farm.OwnerId == discount.IssuerSellerId) &&
        (!discount.FarmId.HasValue || discount.FarmId == product.FarmId) &&
        (discount.agriculturalProducts.Count == 0 || discount.agriculturalProducts.Any(x => x.AgriculturalProductId == product.AgriculturalProductId)) &&
        (discount.Categories.Count == 0 || product.Categories.Any(x => discount.Categories.Any(c => c.CategoryId == x.CategoryId)));

    private static decimal DiscountAmount(Discount discount, decimal eligibleTotal)
    {
        if (eligibleTotal <= 0) throw new BadRequestException("محصول مشمول تخفیف در سبد وجود ندارد.");
        var discountTotal = discount.DiscountType switch {
            DiscountType.Percentage => eligibleTotal * discount.Value / 100m,
            DiscountType.Fixed => discount.Value, // Fixed once per checkout, not once per item/farm.
            _ => throw new BadRequestException("نوع تخفیف معتبر نیست.") };
        discountTotal = decimal.Round(Math.Min(eligibleTotal, Math.Min(discountTotal, discount.MaxDiscountAmount ?? decimal.MaxValue)), 2);
        return discountTotal;
    }

    public async Task<CheckoutDiscountPreviewDto> PreviewDiscountAsync(CheckoutDiscountPreviewInput dto)
    {
        var id = UserId();
        if (dto.CartId == null || dto.CartId == Guid.Empty || string.IsNullOrWhiteSpace(dto.DiscountCode))
            throw new BadRequestException("سبد خرید و کد تخفیف الزامی است.");
        var cart = await _carts.GetAll().AsNoTracking()
            .Include(x => x.CartItems).ThenInclude(x => x.AgriculturalProduct).ThenInclude(x => x.Status)
            .Include(x => x.CartItems).ThenInclude(x => x.AgriculturalProduct).ThenInclude(x => x.Farm).ThenInclude(x => x.Status)
            .Include(x => x.CartItems)
            .ThenInclude(x => x.AgriculturalProduct).ThenInclude(x => x.Categories)
            .Include(x => x.CartItems).ThenInclude(x => x.AgriculturalProduct).ThenInclude(x => x.Offers)
            .SingleOrDefaultAsync(x => x.CartId == dto.CartId && x.UserId == id)
            ?? throw new NotFoundException("سبد خرید یافت نشد.");
        var lines = cart.CartItems.Where(x => !x.IsDeleted).ToList();
        if (lines.Count == 0) throw new BadRequestException("سبد خرید خالی است.");
        var discount = await _discounts.GetAll().AsNoTracking().Include(x => x.Users)
            .Include(x => x.agriculturalProducts).Include(x => x.Categories)
            .SingleOrDefaultAsync(x => x.Code == dto.DiscountCode.Trim());
        ValidateDiscount(discount, id);
        var wholesaleRoles = _configuration.GetSection("Commerce:WholesaleRoles").GetChildren()
            .Select(x => x.Value).Where(x => !string.IsNullOrWhiteSpace(x)).ToList();
        var retail = !_currentUser.Roles.Any(x => wholesaleRoles.Contains(x));
        var now = DateTimeOffset.UtcNow;
        decimal subtotal = 0, eligible = 0;
        foreach (var line in lines)
        {
            var product = line.AgriculturalProduct;
            if (line.Quantity <= 0) throw new BadRequestException($"تعداد محصول «{product.Name}» باید بیشتر از صفر باشد.");
            if (product.IsDeleted) throw new BadRequestException($"محصول «{product.Name}» حذف شده است؛ آن را از سبد حذف کنید.");
            if (product.Status == null || product.Status.IsDeleted || product.Status.Code != AlooGiyah_Shared.Constants.AgriculturalProductStatuses.Sellable)
                throw new BadRequestException($"محصول «{product.Name}» در وضعیت قابل فروش نیست (وضعیت فعلی: {product.Status?.Name ?? "نامشخص"}). وضعیت محصول باید توسط مدیریت بررسی شود.");
            var unit = AlooGiyah_Application.Utils.ProductOfferPricing.UnitPrice(product,
                retail ? product.RetailPrice : product.WholesalePrice, now);
            if (unit < 0) throw new BadRequestException("قیمت محصول معتبر نیست.");
            if (product.Stock < line.Quantity) throw new ConflictException($"موجودی {product.Name} کافی نیست.");
            var total = unit * line.Quantity;
            subtotal += total;
            if (EligibleForDiscount(product, discount!)) eligible += total;
        }
        foreach (var group in lines.GroupBy(line => line.AgriculturalProduct.FarmId))
        {
            var farm = group.First().AgriculturalProduct.Farm;
            if (farm.IsDeleted || farm.Status.Code is not ("14ACE65804" or "49D4721587"))
                throw new BadRequestException("مزرعه در دسترس نیست.");
            var farmSubtotal = group.Sum(line => AlooGiyah_Application.Utils.ProductOfferPricing.UnitPrice(
                line.AgriculturalProduct, retail ? line.AgriculturalProduct.RetailPrice : line.AgriculturalProduct.WholesalePrice, now) * line.Quantity);
            if (farmSubtotal < farm.MinPurchase) throw new BadRequestException($"حداقل خرید مزرعه {farm.Name} رعایت نشده است.");
        }
        var discountAmount = DiscountAmount(discount!, eligible);
        return new CheckoutDiscountPreviewDto { DiscountCode = discount!.Code, Subtotal = subtotal,
            DiscountAmount = discountAmount, PayableAmount = subtotal - discountAmount };
    }

    #region Create From Cart
    public async Task<CheckoutDto> CreateFromCartAsync(CheckoutFromCartDto dto)
    {
        var id = UserId();
        if (dto.CartId == null || dto.CartId == Guid.Empty || string.IsNullOrWhiteSpace(dto.AddressCode) ||
            string.IsNullOrWhiteSpace(dto.IdempotencyKey) || dto.IdempotencyKey.Length is < 8 or > 100)
            throw new BadRequestException("سبد، آدرس و شناسه یکتای درخواست الزامی است.");
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new
            { dto.CartId, Address = dto.AddressCode.Trim(), Discount = dto.DiscountCode?.Trim(), dto.DeliveryBookingCode, dto.ExpectedDeliveryFee }) + (dto.ExpectedDeferredDeliveryFeeLimit.HasValue ? "|shipping-limit:" + dto.ExpectedDeferredDeliveryFeeLimit.Value.ToString(System.Globalization.CultureInfo.InvariantCulture) : ""))));
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
            .Include(x => x.CartItems).ThenInclude(x => x.AgriculturalProduct).ThenInclude(x => x.Offers)
            .SingleOrDefaultAsync(x => x.CartId == dto.CartId && x.UserId == id)
            ?? throw new NotFoundException("سبد خرید یافت نشد؛ سبد مهمان باید ابتدا به حساب منتقل شود.");
        var lines = cart.CartItems.Where(x => !x.IsDeleted).OrderBy(x => x.AgriculturalProductId).ToList();
        if (lines.Count == 0) throw new BadRequestException("سبد خرید خالی است.");
        var address = await _addresses.GetAll().Include(x => x.User).Include(x => x.Province).Include(x => x.County)
            .Include(x => x.City).Include(x => x.Village)
            .SingleOrDefaultAsync(x => x.Code == dto.AddressCode.Trim() && x.UserId == id)
            ?? throw new NotFoundException("آدرس یافت نشد.");
        var booking = _deliveryBookings == null ? null : await _deliveryBookings.GetAll().Include(x => x.Point).Include(x => x.DestinationPoint)
            .Include(x => x.Legs).ThenInclude(x => x.OriginPoint)
            .SingleOrDefaultAsync(x => x.Code == dto.DeliveryBookingCode && x.BuyerId == id);
        if (booking == null || booking.CartId != cart.CartId || booking.CheckoutId.HasValue ||
            booking.CartHash != DeliveryService.CartHash(cart) || booking.AddressCode != address.Code ||
            booking.AddressSnapshot != DeliveryService.AddressSnapshot(address) || !booking.Point.IsActive ||
            (!booking.Fee.HasValue && !booking.DestinationPointId.HasValue) || DeferredDeliveryFunds.KnownFee(booking) != dto.ExpectedDeliveryFee || booking.QuoteExpiresAt <= DateTimeOffset.UtcNow)
            throw new ConflictException("ابتدا روش دریافت و هزینه حمل معتبر را انتخاب و تأیید کنید؛ پس از تغییر سبد یا آدرس، هزینه را دوباره بگیرید.");
        var hasUnpriced = booking.DestinationPointId.HasValue && booking.Legs.Any(l => !l.Fee.HasValue);
        if (hasUnpriced && (dto.ExpectedDeferredDeliveryFeeLimit is not > 0 or > 1_000_000_000m ||
            decimal.Round(dto.ExpectedDeferredDeliveryFeeLimit.Value, 2) != dto.ExpectedDeferredDeliveryFeeLimit.Value) ||
            !hasUnpriced && dto.ExpectedDeferredDeliveryFeeLimit.HasValue)
            throw new BadRequestException("برای هزینه نامشخص، سقف رزرو حمل را صریحاً تأیید کنید.");
        var deliveryGroups = string.IsNullOrEmpty(booking.FarmPointsJson) ? new List<FarmDeliveryGroup>() : JsonSerializer.Deserialize<List<FarmDeliveryGroup>>(booking.FarmPointsJson)!;
        if (deliveryGroups.Count > 0)
        {
            var farmPoints = lines.Select(x => x.AgriculturalProduct.Farm).DistinctBy(x => x.FarmId).ToList();
            if (farmPoints.Any(f => !deliveryGroups.Any(g => g.PointCode == f.DeliveryPointCode && g.FarmIds.Contains(f.FarmId))))
                throw new ConflictException("میدان تحویل مزرعه تغییر کرده است؛ هزینه دریافت را دوباره بررسی کنید.");
            var codes = deliveryGroups.Select(g => g.PointCode).ToList();
            if (_deliveryPoints == null || await _deliveryPoints.GetAll().CountAsync(p => codes.Contains(p.Code) && p.IsActive && !p.IsDeleted) != codes.Count)
                throw new ConflictException("یکی از میدان‌های تحویل غیرفعال شده است.");
        }
        if (booking.DestinationPointId.HasValue)
        {
            if (booking.DestinationPoint is not { IsActive: true, IsDeleted: false } ||
                booking.Fee != (booking.Legs.All(l => l.Fee.HasValue) ? booking.Legs.Sum(l => l.Fee!.Value) : (decimal?)null))
                throw new ConflictException("میدان دریافت یا هزینه حمل تغییر کرده؛ دوباره بررسی کنید.");
            var originIds = booking.Legs.Where(l => l.Kind == "InterHub").Select(l => l.OriginPointId).ToList();
            var supported = _deliveryRoutes == null ? [] : await _deliveryRoutes.GetAll().Include(r => r.CategoryTariffs).Where(r => r.IsActive &&
                ((originIds.Contains(r.OriginPointId) && r.DestinationPointId == booking.DestinationPointId) ||
                 (r.IsBidirectional && originIds.Contains(r.DestinationPointId) && r.OriginPointId == booking.DestinationPointId))).ToListAsync();
            var categoryTree = _deliveryCategories != null && supported.Any(r => r.PricingMode == "CategoryUnits")
                ? await _deliveryCategories.GetAll().AsNoTracking().ToDictionaryAsync(c => c.CategoryId) : [];
            foreach (var leg in booking.Legs)
            {
                if (leg.Kind == "InterHub")
                {
                    var route = supported.SingleOrDefault(r => r.SupportsDirection(leg.OriginPointId, booking.DestinationPointId.Value));
                    var group = deliveryGroups.Single(g => g.PointCode == leg.OriginPoint.Code);
                    var routeItems = lines.Where(i => group.FarmIds.Contains(i.AgriculturalProduct.FarmId));
                    if (route == null || !leg.IsManualPrice &&
                        (DeliveryService.RoutePrice(route, routeItems, categoryTree).Fee != leg.Fee || route.TransitDays != leg.TransitDays))
                        throw new ConflictException("تعرفه یا وضعیت مسیر تغییر کرده؛ هزینه حمل را دوباره بررسی کنید.");
                }
                else if (!leg.IsManualPrice && ((booking.DestinationPoint.CountyId == address.CountyId ? booking.DestinationPoint.DirectFee : null) != leg.Fee))
                    throw new ConflictException("تعرفه ارسال محلی تغییر کرده؛ هزینه را دوباره بررسی کنید.");
            }
        }
        if (hasUnpriced)
        {
            booking.DeferredFeeLimit = dto.ExpectedDeferredDeliveryFeeLimit;
            foreach (var leg in booking.Legs.Where(l => !l.Fee.HasValue)) leg.IsDeferred = true;
            booking.Fee = DeferredDeliveryFunds.KnownFee(booking);
        }
        var pending = await StatusAsync(AgriculturalOrderStatuses.PendingPayment);
        // Only explicitly configured roles receive wholesale pricing.
        var wholesaleRoles = _configuration.GetSection("Commerce:WholesaleRoles").GetChildren()
            .Select(x => x.Value).Where(x => !string.IsNullOrWhiteSpace(x)).ToList();
        var retail = !_currentUser.Roles.Any(x => wholesaleRoles.Contains(x));
        var checkout = new Checkout { BuyerId = id, CartId = cart.CartId, IdempotencyKey = dto.IdempotencyKey,
            DeliveryBooking = booking, RequestHash = hash, ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(20),
            CartSnapshotJson = JsonSerializer.Serialize(lines.ToDictionary(x => x.Code, x => x.Quantity)) };
        var eligible = new Dictionary<int, decimal>();
        var discountCode = dto.DiscountCode?.Trim();
        Discount? discount = null;
        if (discountCode != "" && (discountCode != null || cart.DiscountId.HasValue))
        {
            var discounts = _discounts.GetAll().Include(x => x.Users).Include(x => x.agriculturalProducts).Include(x => x.Categories);
            discount = discountCode != null ? await discounts.SingleOrDefaultAsync(x => x.Code == discountCode)
                : await discounts.SingleOrDefaultAsync(x => x.DiscountId == cart.DiscountId);
            ValidateDiscount(discount, id);
        }
        var grouped = lines.GroupBy(x => x.AgriculturalProduct.FarmId).OrderBy(x => x.Key).ToList();
        var pricingTime = DateTimeOffset.UtcNow;
        foreach (var group in grouped)
        {
            var farm = group.First().AgriculturalProduct.Farm;
            if (farm.IsDeleted || farm.Status.Code is not ("14ACE65804" or "49D4721587"))
                throw new BadRequestException("مزرعه در دسترس نیست.");
            var order = new AgriculturalOrder { BuyerId = id, Buyer = cart.User!, FarmId = farm.FarmId, Farm = farm,
                FarmNameSnapshot = farm.Name, AddressId = address.AddressId, StatusId = pending.StatusId, Status = pending,
                CompanyDelivery = true, InventoryReserved = true, AgriculturalOrderItems = new(),
                AddressSnapshotJson = JsonSerializer.Serialize(new {
                    Recipient = (cart.User!.FName + " " + cart.User.LName).Trim(), cart.User.PhoneNumber,
                    Province = address.Province.Name, County = address.County.Name, City = address.City?.Name,
                    Village = address.Village?.Name, address.Street, address.PostalCode, address.Latitude, address.Longitude
                }) };
            decimal eligibleSubtotal = 0;
            foreach (var line in group)
            {
                var product = line.AgriculturalProduct;
                if (line.Quantity <= 0) throw new BadRequestException($"تعداد محصول «{product.Name}» باید بیشتر از صفر باشد.");
                if (product.IsDeleted) throw new BadRequestException($"محصول «{product.Name}» حذف شده است؛ آن را از سبد حذف کنید.");
                if (product.Status == null || product.Status.IsDeleted || product.Status.Code != AlooGiyah_Shared.Constants.AgriculturalProductStatuses.Sellable)
                    throw new BadRequestException($"محصول «{product.Name}» در وضعیت قابل فروش نیست (وضعیت فعلی: {product.Status?.Name ?? "نامشخص"}). وضعیت محصول باید توسط مدیریت بررسی شود.");
                if (product.Stock < line.Quantity) throw new ConflictException($"موجودی {product.Name} کافی نیست.");
                var unit = AlooGiyah_Application.Utils.ProductOfferPricing.UnitPrice(product,
                    retail ? product.RetailPrice : product.WholesalePrice, pricingTime);
                if (unit < 0) throw new BadRequestException("قیمت محصول معتبر نیست.");
                product.Stock -= line.Quantity; // Atomic with checkout under serializable transaction.
                order.AgriculturalOrderItems.Add(new AgriculturalOrderItem {
                    AgriculturalProductId = product.AgriculturalProductId, Quantity = line.Quantity, Price = unit,
                    SaleUnit = product.SaleUnit, ProductCodeSnapshot = product.Code, ProductNameSnapshot = product.Name, ProductSlugSnapshot = product.Slug });
                var subtotal = unit * line.Quantity;
                order.Subtotal += subtotal;
                if (discount != null && EligibleForDiscount(product, discount))
                    eligibleSubtotal += subtotal;
            }
            if (order.Subtotal < farm.MinPurchase) throw new BadRequestException($"حداقل خرید مزرعه {farm.Name} رعایت نشده است.");
            // Farm-to-origin is seller-paid; quoted inter-hub and local legs are buyer-paid.
            eligible[farm.FarmId] = eligibleSubtotal;
            checkout.Orders.Add(order);
        }
        if (discount != null)
        {
            var discountTotal = DiscountAmount(discount, eligible.Values.Sum());
            var allocations = CheckoutPricing.AllocateDiscount(eligible, discountTotal);
            foreach (var order in checkout.Orders)
            {
                order.DiscountAmount = allocations[order.FarmId!.Value];
                DiscountFunding.Snapshot(order, discount.IssuerSellerId.HasValue);
                if (order.DiscountAmount > 0) order.DiscountId = discount.DiscountId;
            }
            // UsageCount includes active reservations; expiry releases once, payment consumes once.
            discount.UsageCount++; checkout.DiscountId = discount.DiscountId; checkout.DiscountReserved = true;
        }
        if (booking.DestinationPointId.HasValue)
        {
            // A whole-purchase local trip is charged once; each inter-hub trip covers only its source farms.
            foreach (var leg in booking.Legs.Where(l => !l.IsDeferred))
            {
                var source = leg.Kind == "Local" ? null : deliveryGroups.Single(g => g.PointCode == leg.OriginPoint.Code);
                var orders = checkout.Orders.Where(o => source == null || source.FarmIds.Contains(o.FarmId!.Value)).OrderBy(o => o.FarmId).ToList();
                var units = orders.Sum(o => o.AgriculturalOrderItems.Sum(i => (long)i.Quantity));
                var remaining = leg.Fee!.Value;
                for (var i = 0; i < orders.Count; i++)
                {
                    var share = i == orders.Count - 1 ? remaining : decimal.Floor(leg.Fee.Value * orders[i].AgriculturalOrderItems.Sum(l => (decimal)l.Quantity) / units * 100) / 100;
                    orders[i].ShippingAmount += share; remaining -= share;
                }
            }
        }
        else if (deliveryGroups.Count > 0 && deliveryGroups.All(g => g.Fee.HasValue) && deliveryGroups.Sum(g => g.Fee!.Value) == booking.Fee)
        {
            foreach (var deliveryGroup in deliveryGroups)
            {
                var orders = checkout.Orders.Where(o => o.FarmId.HasValue && deliveryGroup.FarmIds.Contains(o.FarmId.Value)).ToList();
                var remaining = deliveryGroup.Fee!.Value;
                var subtotal = orders.Sum(o => o.Subtotal);
                for (var i = 0; i < orders.Count; i++)
                {
                    orders[i].ShippingAmount = i == orders.Count - 1 ? remaining : decimal.Floor(deliveryGroup.Fee.Value * (subtotal > 0 ? orders[i].Subtotal / subtotal : 1m / orders.Count) * 100) / 100;
                    remaining -= orders[i].ShippingAmount;
                }
            }
        }
        else
        {
            var remaining = booking.Fee!.Value;
            var subtotal = checkout.Orders.Sum(o => o.Subtotal);
            for (var i = 0; i < checkout.Orders.Count; i++)
            {
                var order = checkout.Orders[i];
                order.ShippingAmount = i == checkout.Orders.Count - 1 ? remaining : decimal.Floor(booking.Fee.Value * (subtotal > 0 ? order.Subtotal / subtotal : 1m / checkout.Orders.Count) * 100) / 100;
                remaining -= order.ShippingAmount;
            }
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
        if (checkout.Orders.Count == 0 ||
            checkout.Orders.Any(order => !order.AgriculturalOrderItems.Any(item => !item.IsDeleted && item.Quantity > 0)) ||
            checkout.PayableAmount != checkout.Orders.Sum(x => x.TotalPrice))
            throw new ConflictException("مبلغ یا سفارش‌های خرید معتبر نیست.");
        var status = await StatusAsync(AgriculturalOrderStatuses.CheckingInventory);
        var hours = 12;
        var configuredHours = _configuration["Commerce:FarmApprovalHours"];
        if (!string.IsNullOrWhiteSpace(configuredHours) && !int.TryParse(configuredHours, out hours))
            throw new ConflictException("تنظیم مهلت تأیید مزرعه معتبر نیست.");
        if (hours is < 1 or > 168) throw new ConflictException("مهلت تأیید مزرعه باید بین ۱ و ۱۶۸ ساعت باشد.");
        var now = DateTimeOffset.UtcNow;
        var reference = "HOLD_" + checkout.Code;
        var shippingReserve = checkout.DeliveryBooking?.DeferredFeeLimit ?? 0;
        if (checkout.PayableAmount + shippingReserve > 0)
        {
            var wallet = await _wallets.GetAll().SingleOrDefaultAsync(x => x.UserId == id)
                ?? throw new BadRequestException("کیف پول یافت نشد.");
            if (wallet.Balance - wallet.HeldAmount < checkout.PayableAmount + shippingReserve)
                throw new BadRequestException("موجودی آزاد کیف پول کافی نیست.");
            wallet.HeldAmount += checkout.PayableAmount; // Balance changes only when each farm approves.
            if (checkout.PayableAmount > 0) await _walletTransactions.AddAsync(new WalletTransaction { WalletId = wallet.WalletId,
                Amount = checkout.PayableAmount, TransactionType = WalletTransactionType.Hold,
                ReferenceId = reference, Description = "رزرو وجه خرید " + checkout.Code });
            if (shippingReserve > 0)
            {
                var delivery = checkout.DeliveryBooking!;
                wallet.HeldAmount += shippingReserve; delivery.HeldDeliveryFee = shippingReserve;
                delivery.Version = Guid.NewGuid();
                await DeferredDeliveryFunds.Entry(_walletTransactions, wallet, delivery, shippingReserve,
                    WalletTransactionType.Hold, "HOLD", "رزرو سقف تأییدشده حمل");
            }
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
        await _notificationWriter.AddForUserAsync(id, NotificationTypes.OrderSubmitted,
            $"سفارش خرید {checkout.Code} ثبت شد و مبلغ آن تا تأیید مزرعه رزرو شده است.");
        foreach (var order in checkout.Orders)
        {
            if (order.Farm != null)
                await _notificationWriter.AddForUserAsync(order.Farm.OwnerId, NotificationTypes.FarmOrderReceived,
                    $"سفارش جدید {order.Code} برای مزرعه {order.FarmNameSnapshot} ثبت شده و در انتظار بررسی شماست.");
        }
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
        var notice = action == "CheckoutCancelled"
            ? $"خرید {checkout.Code} لغو شد و کالاهای رزروشده به موجودی برگشتند."
            : $"مهلت پرداخت خرید {checkout.Code} تمام شد و کالاهای رزروشده آزاد شدند.";
        await _notificationWriter.AddForUserAsync(
            checkout.BuyerId, action == "CheckoutCancelled"
                ? NotificationTypes.CheckoutCancelled : NotificationTypes.CheckoutExpired, notice);
    }
    #endregion
}
