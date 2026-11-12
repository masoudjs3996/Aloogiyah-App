using System.Data;
using System.Text.Json;
using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using AlooGiyah_Shared.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Application.Services.Store;

public partial class DeliveryService
{
    public async Task<object> Counties()
    {
        RequireManager();
        if (counties == null) throw new InvalidOperationException("County repository is not configured.");
        return await counties.GetAll().AsNoTracking().OrderBy(c => c.Province.Name).ThenBy(c => c.Name)
            .Select(c => new { Id = c.CountyId, Name = c.Province.Name + " / " + c.Name }).ToListAsync();
    }
    public async Task<object> Routes()
    {
        RequireManager();
        if (routes == null) throw new InvalidOperationException("Delivery routes are not configured.");
        return await routes.GetAll().AsNoTracking().OrderBy(r => r.OriginPoint.Name).ThenBy(r => r.DestinationPoint.Name)
            .Select(r => new { r.Code, OriginCode = r.OriginPoint.Code, OriginName = r.OriginPoint.Name,
                DestinationCode = r.DestinationPoint.Code, DestinationName = r.DestinationPoint.Name,
                r.Fee, r.PricingMode, r.IsBidirectional, TariffCount = r.CategoryTariffs.Count(t => !t.IsDeleted), r.MaxQuantity, r.TransitDays, r.IsActive }).ToListAsync();
    }

    public async Task SaveRoute(string? code, DeliveryRouteInput dto)
    {
        RequireManager();
        if (routes == null) throw new InvalidOperationException("Delivery routes are not configured.");
        if (dto.Fee.HasValue) Money(dto.Fee.Value);
        if (dto.PricingMode is not (null or "Flat" or "CategoryUnits") || dto.TransitDays is < 1 or > 30 || dto.MaxQuantity is <= 0 || dto.OriginCode == dto.DestinationCode)
            throw new BadRequestException("مبدأ و مقصد متفاوت و زمان انتقال معتبر انتخاب کنید.");
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var origin = await points.GetAll().SingleOrDefaultAsync(p => p.Code == dto.OriginCode && p.IsActive)
            ?? throw new BadRequestException("میدان مبدأ فعال انتخاب کنید.");
        var destination = await points.GetAll().SingleOrDefaultAsync(p => p.Code == dto.DestinationCode && p.IsActive)
            ?? throw new BadRequestException("میدان مقصد فعال انتخاب کنید.");
        var route = code == null ? new DeliveryRoute() : await routes.GetAll().SingleOrDefaultAsync(r => r.Code == code)
            ?? throw new NotFoundException("مسیر یافت نشد.");
        if (await routes.GetAllIncludingDeleted().AnyAsync(r => r.OriginPointId == origin.DeliveryPointId &&
            r.DestinationPointId == destination.DeliveryPointId && r.Code != route.Code))
            throw new ConflictException("این مسیر قبلاً ثبت شده؛ همان مسیر را ویرایش کنید.");
        var bidirectional = dto.IsBidirectional ?? route.IsBidirectional;
        if (dto.IsActive && await routes.GetAll().AnyAsync(r => r.IsActive && r.Code != route.Code &&
            r.OriginPointId == destination.DeliveryPointId && r.DestinationPointId == origin.DeliveryPointId &&
            (r.IsBidirectional || bidirectional)))
            throw new ConflictException("برای جهت برگشت مسیر فعال جداگانه وجود دارد. ابتدا مسیر جداگانه را غیرفعال کنید.");
        route.IsBidirectional = bidirectional;
        route.OriginPoint = origin; route.DestinationPoint = destination;
        route.Fee = dto.Fee; route.TransitDays = dto.TransitDays; route.MaxQuantity = dto.MaxQuantity;
        route.PricingMode = dto.PricingMode ?? route.PricingMode;
        if (route.PricingMode == "CategoryUnits") route.MaxQuantity = null;
        route.IsActive = dto.IsActive; route.UpdatedAt = DateTimeOffset.UtcNow;
        if (code == null) await routes.AddAsync(route);
        await unit.SaveChangesAsync(); await tx.CommitAsync();
    }

    public async Task<object> Destinations(Guid cartId)
    {
        var id = UserId();
        var cart = await carts.GetAll().Include(c => c.CartItems).ThenInclude(i => i.AgriculturalProduct).ThenInclude(p => p.Farm)
            .SingleOrDefaultAsync(c => c.CartId == cartId && c.UserId == id) ?? throw new NotFoundException("سبد یافت نشد.");
        var groups = await Groups(cart, "Pickup");
        var origins = groups.Select(g => g.PointCode).ToList();
        var supported = routes == null ? [] : await routes.GetAll().Where(r => r.IsActive &&
            (origins.Contains(r.OriginPoint.Code) || r.IsBidirectional && origins.Contains(r.DestinationPoint.Code)) && r.OriginPoint.IsActive && !r.OriginPoint.IsDeleted && r.DestinationPoint.IsActive && !r.DestinationPoint.IsDeleted)
            .Select(r => new { Origin = r.OriginPoint.Code, Destination = r.DestinationPoint.Code, r.IsBidirectional }).ToListAsync();
        var candidates = await points.GetAll().AsNoTracking().Where(p => p.IsActive)
            .Select(p => new { p.Code, p.Name, p.Address, p.Hours, p.CollectionTerms,
                CountyCode = p.County == null ? null : p.County.Code,
                CountyName = p.County == null ? null : p.County.Name }).ToListAsync();
        return candidates.Where(p => origins.All(o => o == p.Code || supported.Any(r => (r.Origin == o && r.Destination == p.Code) || (r.IsBidirectional && r.Destination == o && r.Origin == p.Code))))
            .OrderByDescending(p => origins.Contains(p.Code)).ThenBy(p => p.Name).ToList();
    }

    private async Task<string> AutomaticDestination(Cart cart, Address address)
    {
        var groups = await Groups(cart, "Pickup");
        var originCodes = groups.Select(g => g.PointCode).ToList();
        var candidates = await points.GetAll().Where(p => p.IsActive && p.CountyId == address.CountyId).ToListAsync();
        if (candidates.Count == 0)
            throw new BadRequestException("هنوز میدان سرویس‌دهنده شهرستان این نشانی تنظیم نشده است؛ برای هماهنگی ارسال با پشتیبانی تماس بگیرید.");
        var destinationIds = candidates.Select(p => p.DeliveryPointId).ToList();
        var supported = routes == null ? [] : await routes.GetAll().Include(r => r.OriginPoint).Include(r => r.DestinationPoint).Include(r => r.CategoryTariffs)
            .Where(r => r.IsActive && r.OriginPoint.IsActive && !r.OriginPoint.IsDeleted &&
                ((originCodes.Contains(r.OriginPoint.Code) && destinationIds.Contains(r.DestinationPointId)) ||
                 (r.IsBidirectional && originCodes.Contains(r.DestinationPoint.Code) && destinationIds.Contains(r.OriginPointId)))).ToListAsync();
        var categoryTree = supported.Any(r => r.PricingMode == "CategoryUnits") ? await TariffCategoryTree() : [];
        var options = candidates.Select(destination =>
        {
            var valid = true; var known = destination.DirectFee.HasValue; var fee = destination.DirectFee ?? 0m; var days = 0;
            foreach (var group in groups.Where(g => g.PointCode != destination.Code))
            {
                var route = supported.SingleOrDefault(r => (r.OriginPoint.Code == group.PointCode && r.DestinationPointId == destination.DeliveryPointId) ||
                    (r.IsBidirectional && r.DestinationPoint.Code == group.PointCode && r.OriginPointId == destination.DeliveryPointId));
                if (route == null) { valid = false; break; }
                var price = RoutePrice(route, cart.CartItems.Where(i => !i.IsDeleted && group.FarmIds.Contains(i.AgriculturalProduct.FarmId)), categoryTree);
                known &= price.Fee.HasValue;
                fee += price.Fee ?? 0m; days = Math.Max(days, route.TransitDays);
            }
            return new { destination.Code, Valid = valid, Known = known, Fee = fee, Days = days };
        }).Where(o => o.Valid).OrderByDescending(o => o.Known).ThenBy(o => o.Known ? o.Fee : decimal.MaxValue)
            .ThenBy(o => o.Days).ThenBy(o => o.Code).FirstOrDefault();
        return options?.Code ?? throw new BadRequestException("مسیر ارسال همه اقلام این سبد به شهرستان نشانی شما هنوز فعال نیست؛ با پشتیبانی هماهنگ کنید یا سبد را بر اساس میدان مبدأ جدا کنید.");
    }

    private async Task<DeliveryBooking> RoutedQuote(Cart cart, Address address, DeliveryQuoteInput dto)
    {
        var destination = await points.GetAll().SingleOrDefaultAsync(p => p.Code == dto.PointCode && p.IsActive)
            ?? throw new BadRequestException("میدان دریافت را انتخاب کنید.");
        var groups = await Groups(cart, "Pickup");
        var booking = new DeliveryBooking
        {
            BuyerId = UserId(), CartId = cart.CartId, CartHash = CartHash(cart), AddressCode = address.Code,
            AddressSnapshot = AddressSnapshot(address), DestinationPoint = destination, Method = dto.Method,
            Window = dto.Window.Trim(), QuoteExpiresAt = DateTimeOffset.UtcNow.AddHours(24),
            PointSnapshot = $"{destination.Name} — {destination.Address} — {destination.Hours} — {destination.CollectionTerms}"
        };
        var originCodes = groups.Select(g => g.PointCode).ToList();
        var origins = await points.GetAll().Where(p => originCodes.Contains(p.Code) && p.IsActive).ToListAsync();
        var originIds = origins.Select(p => p.DeliveryPointId).ToList();
        var supported = routes == null ? [] : await routes.GetAll().Include(r => r.CategoryTariffs).Where(r => r.IsActive &&
            ((originIds.Contains(r.OriginPointId) && r.DestinationPointId == destination.DeliveryPointId) ||
             (r.IsBidirectional && originIds.Contains(r.DestinationPointId) && r.OriginPointId == destination.DeliveryPointId))).ToListAsync();
        var categoryTree = supported.Any(r => r.PricingMode == "CategoryUnits") ? await TariffCategoryTree() : [];
        foreach (var group in groups)
        {
            var origin = origins.Single(p => p.Code == group.PointCode);
            booking.Point ??= origin; // Keep the historical source-point column and APIs compatible.
            if (origin.DeliveryPointId == destination.DeliveryPointId) continue;
            var route = supported.SingleOrDefault(r => r.SupportsDirection(origin.DeliveryPointId, destination.DeliveryPointId));
            if (route == null) throw new BadRequestException($"انتقال از {origin.Name} به {destination.Name} هنوز فعال نیست؛ میدان دیگری انتخاب کنید.");
            var price = RoutePrice(route, cart.CartItems.Where(i => !i.IsDeleted && group.FarmIds.Contains(i.AgriculturalProduct.FarmId)), categoryTree);
            booking.Legs.Add(new DeliveryLeg
            {
                OriginPoint = origin, DestinationPoint = destination,
                RouteSnapshot = $"{origin.Name} ← {destination.Name}",
                Fee = price.Fee, PricingDetailsJson = JsonSerializer.Serialize(price.Details),
                TransitDays = route.TransitDays
            });
        }
        if (dto.Method == "Direct")
            booking.Legs.Add(new DeliveryLeg { OriginPoint = destination, Kind = "Local",
                RouteSnapshot = $"{destination.Name} ← نشانی خریدار",
                Fee = destination.CountyId.HasValue && destination.CountyId == address.CountyId ? destination.DirectFee : null });
        booking.FarmPointsJson = JsonSerializer.Serialize(groups);
        UpdateTotal(booking);
        return booking;
    }

    private static void UpdateTotal(DeliveryBooking b) => b.Fee = b.Legs.All(l => l.Fee.HasValue) ? b.Legs.Sum(l => l.Fee!.Value) : null;

    public async Task PriceLeg(string code, string legCode, decimal fee)
    {
        RequireManager(); Money(fee);
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var b = await Find(code);
        if (!b.DestinationPointId.HasValue) throw new ConflictException("این رزرو مسیر حمل ندارد.");
        var leg = b.Legs.SingleOrDefault(l => l.Code == legCode) ?? throw new NotFoundException("بخش حمل یافت نشد.");
        if (b.CheckoutId.HasValue && (!leg.IsDeferred || b.DeferredFeePaid.HasValue || b.Checkout?.IsSubmitted != true))
            throw new ConflictException("فقط هزینه نامشخص سفارش ثبت‌شده و تسویه‌نشده قابل تعیین است.");
        if (b.CheckoutId.HasValue && b.Checkout!.Orders.Any(o => o.Status.Code != AlooGiyah_Shared.Constants.AgriculturalOrderStatuses.Rejected && !o.IsPaid))
            throw new ConflictException("ابتدا بررسی همه سفارش‌ها توسط مزرعه‌ها باید تمام شود.");
        leg.Fee = fee; leg.IsManualPrice = true;
        if (!b.CheckoutId.HasValue) UpdateTotal(b);
        else
        {
            var wallet = await wallets.GetAll().SingleOrDefaultAsync(w => w.UserId == b.BuyerId)
                ?? throw new ConflictException("کیف پول خریدار یافت نشد.");
            await DeferredDeliveryFunds.Settle(b, wallet, transactions);
        }
        b.QuotedById = UserId(); b.QuoteExpiresAt = DateTimeOffset.UtcNow.AddHours(24);
        Event(b, "LegQuoted", $"{leg.RouteSnapshot}: {fee}");
        if (b.CheckoutId.HasValue)
            await notices.AddForUserAsync(b.BuyerId, "به‌روزرسانی هزینه حمل", b.DeferredFeePaid.HasValue
                ? $"هزینه نهایی حمل {b.Code} از رزرو تسویه و باقیمانده آزاد شد."
                : DeferredDeliveryFunds.Proposed(b).HasValue ? $"هزینه حمل {b.Code} از سقف شما بیشتر است؛ برای تسویه، مبلغ جدید را در جزئیات خرید تأیید کنید." : "بخشی از هزینه حمل مشخص شد؛ رزرو شما حفظ شده است.");
        else if (b.Fee.HasValue) await notices.AddForUserAsync(b.BuyerId, "هزینه حمل آماده تأیید است", $"هزینه حمل خرید {b.Code} مشخص شد؛ مبلغ را پیش از پرداخت تأیید کنید.");
        await unit.SaveChangesAsync(); await tx.CommitAsync();
    }

    public async Task AcceptDeferredFee(string code, decimal expectedFee)
    {
        Money(expectedFee);
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var b = await Find(code, buyerOnly: true);
        var proposed = DeferredDeliveryFunds.Proposed(b);
        if (b.DeferredFeePaid.HasValue)
        {
            if (b.DeferredFeePaid != expectedFee) throw new ConflictException("هزینه حمل قبلاً با مبلغ دیگری تسویه شده است.");
            return;
        }
        if (b.Checkout?.IsSubmitted != true || !proposed.HasValue || proposed != expectedFee || b.HeldDeliveryFee <= 0)
            throw new ConflictException("مبلغ حمل تغییر کرده؛ جزئیات را دوباره بررسی کنید.");
        var wallet = await wallets.GetAll().SingleOrDefaultAsync(w => w.UserId == b.BuyerId)
            ?? throw new ConflictException("کیف پول خریدار یافت نشد.");
        var extra = Math.Max(0, expectedFee - b.HeldDeliveryFee);
        if (wallet.Balance - wallet.HeldAmount < extra) throw new BadRequestException("موجودی آزاد کیف پول برای مازاد حمل کافی نیست؛ کیف پول را شارژ کنید.");
        if (extra > 0)
        {
            wallet.HeldAmount += extra; b.HeldDeliveryFee += extra; b.DeferredFeeLimit = expectedFee;
            await DeferredDeliveryFunds.Entry(transactions, wallet, b, extra, WalletTransactionType.Hold, "EXTRA", "رزرو مازاد حمل با تأیید خریدار");
        }
        await DeferredDeliveryFunds.Settle(b, wallet, transactions);
        Event(b, "DeferredFeeAccepted", $"{expectedFee}");
        await unit.SaveChangesAsync(); await tx.CommitAsync();
    }

    private static FarmDeliveryGroup? SourceGroup(DeliveryBooking b, int? farmId) =>
        string.IsNullOrEmpty(b.FarmPointsJson) ? null : JsonSerializer.Deserialize<List<FarmDeliveryGroup>>(b.FarmPointsJson)!
            .SingleOrDefault(g => farmId.HasValue && g.FarmIds.Contains(farmId.Value));

    public async Task Dispatch(string code, string legCode)
    {
        RequireManager();
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var b = await Find(code);
        if (b.DeferredFeeLimit.HasValue && !b.DeferredFeePaid.HasValue)
            throw new ConflictException("پیش از اعزام، هزینه حمل را در سقف رزرو تسویه کنید یا تأیید مازاد را بگیرید.");
        var leg = b.Legs.SingleOrDefault(l => l.Code == legCode && l.Kind == "InterHub") ?? throw new NotFoundException("مسیر یافت نشد.");
        var orders = b.Checkout?.Orders.Where(o => SourceGroup(b, o.FarmId)?.PointCode == leg.OriginPoint.Code &&
            o.Status.Code != AlooGiyah_Shared.Constants.AgriculturalOrderStatuses.Rejected).ToList();
        if (leg.Status != "Waiting" || orders == null || orders.Count == 0 || orders.Any(o => !o.IsPaid ||
            o.Status.Code != AlooGiyah_Shared.Constants.AgriculturalOrderStatuses.Shipped ||
            o.AgriculturalOrderItems.Any(i => !i.IsDeleted && i.ReceivedAtOriginQuantity < i.Quantity)))
            throw new ConflictException("ابتدا ورود کامل اقلام تأییدشده به میدان مبدأ را ثبت کنید.");
        leg.Status = "InTransit"; Event(b, "InterHubDispatched", leg.RouteSnapshot);
        await notices.AddForUserAsync(b.BuyerId, "بار در مسیر میدان دریافت است", $"بار شما از {leg.OriginPoint.Name} به {b.DestinationPoint!.Name} ارسال شد؛ پس از رسیدن، زمان دریافت هماهنگ می‌شود.");
        await unit.SaveChangesAsync(); await tx.CommitAsync();
    }
}
