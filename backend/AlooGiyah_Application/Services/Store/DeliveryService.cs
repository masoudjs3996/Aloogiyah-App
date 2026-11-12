using System.Data;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AlooGiyah_Application.Services.Store;

public partial class DeliveryService(IGenericRepository<DeliveryPoint> points, IGenericRepository<DeliveryBooking> bookings,
    IGenericRepository<Cart> carts, IGenericRepository<Address> addresses,
    IGenericRepository<Status> statuses, IGenericRepository<SellerReceivable> incomes,
    IGenericRepository<User> users, IGenericRepository<Wallet> wallets, IGenericRepository<WalletTransaction> transactions,
    ICurrentUserService user, IUnitOfWork unit, INotificationWriter notices, IConfiguration config,
    IGenericRepository<Checkout>? checkouts = null, IGenericRepository<Farm>? farms = null,
    IGenericRepository<DeliveryRoute>? routes = null, IGenericRepository<County>? counties = null,
    IGenericRepository<DeliveryCategoryTariff>? tariffs = null, IGenericRepository<Category>? tariffCategories = null)
{
    private int UserId() => user.IsAuthenticated && !user.IsGuest && int.TryParse(user.UserId, out var id)
        ? id : throw new UnauthorizedException("ابتدا وارد حساب شوید.");
    private bool Manager => user.Roles.Any(x => x is "Admin" or "Manager");
    private bool Agent => Manager || user.Roles.Contains("DeliveryAgent");
    private void RequireManager() { UserId(); if (!Manager) throw new ForbiddenException("فقط مدیریت مجاز است."); }
    public static bool Live(string status) => status is "Ready" or "OutForDelivery" or "Disputed";
    private static void Money(decimal fee) { if (fee < 0 || fee > 1_000_000_000m || decimal.Round(fee, 2) != fee) throw new BadRequestException("هزینه معتبر وارد کنید."); }
    public static string CartHash(Cart cart) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(
        JsonSerializer.Serialize(cart.CartItems.Where(x => !x.IsDeleted).OrderBy(x => x.Code).Select(x => new { x.Code, x.Quantity, x.AgriculturalProduct.SaleUnit })))));
    public static string AddressSnapshot(Address a) => JsonSerializer.Serialize(new { a.Code, a.Street, a.PostalCode, a.CountyId, a.Latitude, a.Longitude, Province = a.Province.Name, County = a.County.Name, City = a.City == null ? null : a.City.Name, Village = a.Village == null ? null : a.Village.Name, Recipient = (a.User.FName + " " + a.User.LName).Trim(), a.User.PhoneNumber });
    public static decimal ReleaseFor(AgriculturalOrder order, SellerReceivable income)
    {
        var items = order.AgriculturalOrderItems.Where(x => !x.IsDeleted).ToList();
        if (items.Count == 0) return 0;
        if (items.All(x => x.DeliveredQuantity == x.Quantity)) return income.NetAmount;
        var value = items.Sum(x => x.Price * x.Quantity);
        var fraction = value > 0 ? items.Sum(x => x.Price * x.DeliveredQuantity) / value
            : (decimal)items.Sum(x => (long)x.DeliveredQuantity) / items.Sum(x => (long)x.Quantity);
        // Round down so partial releases can never exceed the full entitlement.
        return decimal.Floor(income.NetAmount * fraction * 100m) / 100m;
    }
    private IQueryable<DeliveryBooking> Query() => bookings.GetAll()
        .Include(x => x.Point).Include(x => x.DestinationPoint).Include(x => x.Events)
        .Include(x => x.Legs).ThenInclude(x => x.OriginPoint)
        .Include(x => x.Legs).ThenInclude(x => x.DestinationPoint)
        .Include(x => x.Checkout)!.ThenInclude(x => x!.Orders).ThenInclude(x => x.Status)
        .Include(x => x.Checkout)!.ThenInclude(x => x!.Orders).ThenInclude(x => x.History)
        .Include(x => x.Checkout)!.ThenInclude(x => x!.Orders).ThenInclude(x => x.AgriculturalOrderItems)
        .Include(x => x.Batches).ThenInclude(x => x.Items).AsSplitQuery();
    private async Task<DeliveryBooking> Find(string code, bool buyerOnly = false)
    {
        var id = UserId();
        var b = await Query().SingleOrDefaultAsync(x => x.Code == code &&
            (x.BuyerId == id || !buyerOnly && (Manager || Agent && x.Batches.Any(y => y.AgentId == id))))
            ?? throw new NotFoundException("تحویل یافت نشد.");
        return b;
    }
    private void Event(DeliveryBooking b, string action, string note)
    {
        b.Events.Add(new() { ActorId = UserId(), Action = action, Note = note });
        b.Version = Guid.NewGuid(); b.UpdatedAt = DateTimeOffset.UtcNow;
    }
    private static DeliveryBookingDto Map(DeliveryBooking b)
    {
        var groups = string.IsNullOrEmpty(b.FarmPointsJson) ? new List<FarmDeliveryGroup>() : JsonSerializer.Deserialize<List<FarmDeliveryGroup>>(b.FarmPointsJson)!;
        var allLines = b.Checkout?.Orders.SelectMany(order =>
        {
            var source = groups.SingleOrDefault(g => order.FarmId.HasValue && g.FarmIds.Contains(order.FarmId.Value));
            return order.AgriculturalOrderItems.Select(item => new DeliveryLineDto(
                item.Code, order.Code, order.FarmNameSnapshot, item.ProductNameSnapshot, item.Quantity,
                item.ReceivedAtHubQuantity, item.DeliveredQuantity,
                b.Batches.Where(batch => Live(batch.Status)).SelectMany(batch => batch.Items)
                    .Where(line => line.AgriculturalOrderItemId == item.AgriculturalOrderItemId).Sum(line => line.Quantity))
            {
                ReceivedAtOriginQuantity = item.ReceivedAtOriginQuantity, OriginPoint = source?.Name ?? b.Point.Name,
                SaleUnit = item.SaleUnit, OriginCode = source?.PointCode ?? b.Point.Code, IsPaid = order.IsPaid, OrderStatus = order.Status.Code,
                InterHub = b.DestinationPointId.HasValue && source?.PointCode != b.DestinationPoint?.Code
            });
        }).ToList() ?? [];
        var activeOrders = b.Checkout?.Orders.Where(o => o.Status.Code != AgriculturalOrderStatuses.Rejected).Select(o => o.Code).ToHashSet() ?? [];
        var lines = b.DestinationPointId.HasValue ? allLines.Where(l => activeOrders.Contains(l.OrderCode)).ToList() : allLines;
        var batches = b.Batches.OrderByDescending(batch => batch.CreatedAt).Select(batch => new DeliveryBatchDto(
            batch.Code, batch.AgentId, batch.Status, batch.ExpectedAt, batch.Note, batch.CompletedAt,
            batch.Items.Select(item =>
            {
                var line = allLines.Single(l => l.ItemCode == item.OrderItem.Code);
                return new DeliveryBatchLineDto(line.ItemCode, line.OrderCode, line.FarmName, line.Name, item.Quantity) { SaleUnit = line.SaleUnit };
            }).ToList())).ToList();
        return new(b.Code, b.Checkout?.Code, b.Method, b.Window, b.PointSnapshot, b.AddressSnapshot, b.Fee, b.QuoteExpiresAt,
            b.RequestedMethod, b.ChangeFee, b.ChangeReason, lines, batches,
            b.Events.OrderBy(e => e.CreatedAt).Select(e => new DeliveryEventDto(e.ActorId, e.Action, e.Note, e.CreatedAt)).ToList())
        {
            KnownFee = DeferredDeliveryFunds.KnownFee(b), HasUnpricedLegs = b.Legs.Any(l => !l.Fee.HasValue),
            DeferredFeeLimit = b.DeferredFeeLimit, HeldDeliveryFee = b.HeldDeliveryFee,
            DeferredFeePaid = b.DeferredFeePaid, ProposedDeferredFee = DeferredDeliveryFunds.Proposed(b),
            Groups = groups, DestinationCode = b.DestinationPoint?.Code,
            Legs = b.Legs.Select(l => new DeliveryLegDto(l.Code, l.Kind, l.RouteSnapshot, l.Fee, l.TransitDays, l.Status) { IsDeferred = l.IsDeferred, OriginCode = l.OriginPoint.Code,
                PricingDetails = JsonSerializer.Deserialize<List<DeliveryTariffLineDto>>(l.PricingDetailsJson) ?? [] }).ToList()
        };
    }
    public async Task<object> Points(bool manage = false)
    {
        if (manage) RequireManager();
        return await points.GetAll().AsNoTracking().Where(x => manage || x.IsActive).OrderBy(x => x.Name)
            .Select(x => new { x.Code, x.Name, x.Address, x.Hours, x.CollectionTerms, x.IsActive, x.DirectFee, x.CountyId, CountyName = x.County == null ? null : x.County.Name }).ToListAsync();
    }
    public async Task<object> Agents()
    {
        RequireManager();
        return await users.GetAll().Where(x => x.Role.Name == "Admin" || x.Role.Name == "Manager" || x.Role.Name == "DeliveryAgent" ||
            x.AdditionalRoles.Any(r => !r.IsDeleted && !r.Role.IsDeleted && (r.Role.Name == "DeliveryAgent" || r.Role.Name == "Admin" || r.Role.Name == "Manager")))
            .OrderBy(x => x.FName).Select(x => new { Id = x.UserId, Name = x.FName + " " + x.LName }).ToListAsync();
    }
    public async Task SavePoint(string? code, DeliveryPointInput dto)
    {
        RequireManager(); if (dto.DirectFee.HasValue) Money(dto.DirectFee.Value);
        if (dto.CountyId.HasValue && (counties == null || !await counties.GetAll().AnyAsync(c => c.CountyId == dto.CountyId)))
            throw new BadRequestException("شهرستان سرویس محلی معتبر انتخاب کنید.");
        var p = code == null ? new DeliveryPoint() : await points.GetAll().SingleOrDefaultAsync(x => x.Code == code)
            ?? throw new NotFoundException("میدان یافت نشد.");
        p.Name = dto.Name.Trim(); p.Address = dto.Address.Trim(); p.Hours = dto.Hours.Trim();
        p.CollectionTerms = dto.CollectionTerms.Trim(); p.DirectFee = dto.DirectFee; p.IsActive = dto.IsActive; p.CountyId = dto.CountyId;
        if (code == null) await points.AddAsync(p);
        await unit.SaveChangesAsync();
    }
    public async Task<object?> PublicFarmPoint(string farmCode)
    {
        var farm = farms == null ? null : await farms.GetAll().AsNoTracking()
            .SingleOrDefaultAsync(x => x.Code == farmCode && !x.IsDeleted);
        if (farm == null) throw new NotFoundException("مزرعه یافت نشد.");
        return await points.GetAll().AsNoTracking()
            .Where(x => x.Code == farm.DeliveryPointCode && x.IsActive && !x.IsDeleted)
            .Select(x => new { x.Name, x.Address, x.Hours, x.CollectionTerms }).SingleOrDefaultAsync();
    }
    public async Task<object> FarmPoint(string farmCode, string? pointCode = null)
    {
        var id = UserId();
        var farm = farms == null ? null : await farms.GetAll().SingleOrDefaultAsync(x => x.Code == farmCode && !x.IsDeleted);
        if (farm == null) throw new NotFoundException("مزرعه یافت نشد.");
        if (farm.OwnerId != id && !Manager) throw new ForbiddenException("فقط مالک مزرعه می‌تواند میدان تحویل را تنظیم کند.");
        if (pointCode != null)
        {
            if (!await points.GetAll().AnyAsync(x => x.Code == pointCode && x.IsActive && !x.IsDeleted)) throw new BadRequestException("میدان فعال انتخاب کنید.");
            farm.DeliveryPointCode = pointCode;
            await unit.SaveChangesAsync();
        }
        return new { farmCode, pointCode = farm.DeliveryPointCode };
    }
    private async Task<List<FarmDeliveryGroup>> Groups(Cart cart, string method)
    {
        var selected = cart.CartItems.Where(x => !x.IsDeleted).Select(x => x.AgriculturalProduct.Farm).DistinctBy(x => x.FarmId).ToList();
        if (selected.Count == 0) throw new BadRequestException("سبد خالی است.");
        var missing = selected.Where(x => string.IsNullOrWhiteSpace(x.DeliveryPointCode)).Select(x => x.Name).ToList();
        if (missing.Count > 0) throw new BadRequestException("میدان مبدأ این مزرعه‌ها هنوز مشخص نشده است: " + string.Join("، ", missing) + ". فروشنده یا پشتیبانی باید میدان مبدأ را ثبت کند.");
        var codes = selected.Select(x => x.DeliveryPointCode).ToList();
        var active = await points.GetAll().Where(x => codes.Contains(x.Code) && x.IsActive && !x.IsDeleted).ToListAsync();
        if (active.Count != codes.Distinct().Count()) throw new ConflictException("میدان یکی از مزرعه‌ها غیرفعال شده است؛ فروشنده باید میدان جدید انتخاب کند.");
        return active.OrderBy(x => x.Code).Select(p => new FarmDeliveryGroup(p.Code, p.Name, p.Address, p.Hours,
            method == "Pickup" ? 0 : p.DirectFee,
            selected.Where(f => f.DeliveryPointCode == p.Code).Select(f => f.FarmId).OrderBy(x => x).ToList(),
            selected.Where(f => f.DeliveryPointCode == p.Code).Select(f => f.Name).ToList())).ToList();
    }
    public async Task<List<FarmDeliveryGroup>> Preview(Guid cartId, string method)
    {
        var id = UserId();
        if (method is not ("Pickup" or "Direct")) throw new BadRequestException("روش دریافت معتبر نیست.");
        var cart = await carts.GetAll().Include(x => x.CartItems).ThenInclude(x => x.AgriculturalProduct).ThenInclude(x => x.Categories)
            .Include(x => x.CartItems).ThenInclude(x => x.AgriculturalProduct).ThenInclude(x => x.Farm)
            .SingleOrDefaultAsync(x => x.CartId == cartId && x.UserId == id) ?? throw new NotFoundException("سبد یافت نشد.");
        return await Groups(cart, method);
    }
    public async Task<DeliveryBookingDto> Quote(DeliveryQuoteInput dto)
    {
        var id = UserId(); if (dto.Method is not ("Pickup" or "Direct") || string.IsNullOrWhiteSpace(dto.Window)) throw new BadRequestException("روش و بازه دریافت الزامی است.");
        var cart = await carts.GetAll().Include(x => x.CartItems).ThenInclude(x => x.AgriculturalProduct).ThenInclude(x => x.Categories)
            .Include(x => x.CartItems).ThenInclude(x => x.AgriculturalProduct).ThenInclude(x => x.Farm).SingleOrDefaultAsync(x => x.CartId == dto.CartId && x.UserId == id)
            ?? throw new NotFoundException("سبد یافت نشد.");
        if (!cart.CartItems.Any(x => !x.IsDeleted)) throw new BadRequestException("سبد خالی است.");
        var a = await addresses.GetAll().Include(x => x.User).Include(x => x.Province).Include(x => x.County).Include(x => x.City).Include(x => x.Village).SingleOrDefaultAsync(x => x.Code == dto.AddressCode && x.UserId == id) ?? throw new NotFoundException("آدرس یافت نشد.");
        if (string.IsNullOrWhiteSpace(dto.PointCode))
        {
            if (dto.Method == "Pickup") throw new BadRequestException("میدان دریافت را انتخاب کنید.");
            dto = dto with { PointCode = await AutomaticDestination(cart, a) };
        }
        var b = await RoutedQuote(cart, a, dto);
        Event(b, "QuoteRequested", "حمل تا میدان با کشاورز؛ مسیر میدان تا مقصد با خریدار.");
        await bookings.AddAsync(b); await unit.SaveChangesAsync(); return Map(b);
    }
    public async Task<DeliveryBookingDto> Get(string code) => Map(await Find(code));
    public async Task<DeliveryBookingDto> AttachLegacy(LegacyDeliveryInput dto)
    {
        RequireManager();
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var checkout = checkouts == null ? null : await checkouts.GetAll().Include(x => x.DeliveryBooking)
            .Include(x => x.Orders).ThenInclude(x => x.Status).Include(x => x.Orders).ThenInclude(x => x.AgriculturalOrderItems)
            .SingleOrDefaultAsync(x => x.Code == dto.CheckoutCode);
        if (checkout == null || !checkout.IsSubmitted || checkout.DeliveryBooking != null || checkout.Orders.Any(x => x.CompanyDelivery) ||
            !checkout.Orders.Any(x => x.IsPaid && x.Status.Code is AgriculturalOrderStatuses.Approved or AgriculturalOrderStatuses.Shipped))
            throw new ConflictException("فقط خرید قدیمیِ بدون برنامه تحویل، با سفارش پرداخت‌شده و باز، قابل اتصال است.");
        var point = await points.GetAll().SingleOrDefaultAsync(x => x.Code == dto.PointCode && x.IsActive)
            ?? throw new NotFoundException("میدان فعال یافت نشد.");
        var b = new DeliveryBooking { BuyerId = checkout.BuyerId, Checkout = checkout, CartId = checkout.CartId,
            AddressSnapshot = checkout.Orders.First().AddressSnapshotJson, Point = point,
            PointSnapshot = $"{point.Name} — {point.Address} — {point.Hours} — {point.CollectionTerms}",
            Method = "Pickup", Window = dto.Window.Trim(), Fee = 0, QuoteExpiresAt = DateTimeOffset.UtcNow };
        Event(b, "LegacyAttached", "اتصال خرید قدیمی به تحویل با کد؛ بدون برداشت هزینه جدید.");
        await bookings.AddAsync(b); await unit.SaveChangesAsync(); await tx.CommitAsync();
        return Map(b);
    }
    public async Task<object> List(bool manage = false, int page = 1, string? checkout = null)
    {
        var id = UserId(); if (manage) RequireManager();
        var q = Query().Where(x => manage || x.BuyerId == id || Agent && x.Batches.Any(y => y.AgentId == id));
        if (!string.IsNullOrWhiteSpace(checkout)) q = q.Where(x => x.Checkout != null && x.Checkout.Code == checkout);
        var total = await q.CountAsync();
        var rows = await q.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.DeliveryBookingId).Skip((Math.Max(1, page) - 1) * 20).Take(20).ToListAsync();
        return new { Items = rows.Select(Map), TotalCount = total, PageNumber = Math.Max(1, page), PageSize = 20 };
    }
    public async Task Price(string code, decimal fee)
    {
        RequireManager(); Money(fee);
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var b = await Find(code);
        if (b.DestinationPointId.HasValue || b.CheckoutId.HasValue || b.Method == "Pickup" && fee != 0) throw new ConflictException("برای خرید جدید، هزینه هر بخش حمل را جدا ثبت کنید؛ هزینه خرید ثبت‌شده قابل تغییر نیست.");
        b.Fee = fee; b.QuotedById = UserId(); b.QuoteExpiresAt = DateTimeOffset.UtcNow.AddHours(24);
        Event(b, "Quoted", $"هزینه مسیر میدان تا مقصد: {fee}");
        await notices.AddForUserAsync(b.BuyerId, "هزینه ارسال مشخص شد", $"هزینه تحویل {b.Code} مشخص شد؛ پیش از ثبت خرید مبلغ را بررسی کنید.");
        await unit.SaveChangesAsync(); await tx.CommitAsync();
    }
    public async Task Receive(string code, HubReceiptInput dto)
    {
        RequireManager(); if (dto.Quantity <= 0) throw new BadRequestException("تعداد معتبر وارد کنید.");
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var b = await Find(code);
        var item = b.Checkout?.Orders.SelectMany(x => x.AgriculturalOrderItems).SingleOrDefault(x => x.Code == dto.ItemCode)
            ?? throw new NotFoundException("قلم یافت نشد.");
        var order = b.Checkout!.Orders.Single(x => x.AgriculturalOrderId == item.AgriculturalOrderId);
        if (!order.IsPaid || order.Status.Code != AgriculturalOrderStatuses.Shipped || dto.Quantity > item.Quantity - item.ReceivedAtHubQuantity)
            throw new ConflictException("تعداد یا وضعیت ورود به میدان معتبر نیست.");
        if (dto.Stage is not ("Origin" or "Destination")) throw new BadRequestException("مرحله دریافت معتبر نیست.");
        var group = SourceGroup(b, order.FarmId);
        var interHub = b.DestinationPointId.HasValue && group?.PointCode != b.DestinationPoint?.Code;
        if (interHub)
        {
            var leg = b.Legs.Single(l => l.Kind == "InterHub" && l.OriginPoint.Code == group!.PointCode);
            if (dto.Stage == "Origin")
            {
                if (leg.Status != "Waiting" || dto.Quantity > item.Quantity - item.ReceivedAtOriginQuantity)
                    throw new ConflictException("تعداد یا وضعیت ورود به میدان مبدأ معتبر نیست.");
                item.ReceivedAtOriginQuantity += dto.Quantity;
            }
            else
            {
                if (leg.Status != "InTransit" || dto.Quantity > item.ReceivedAtOriginQuantity - item.ReceivedAtHubQuantity)
                    throw new ConflictException("ابتدا ارسال بار از میدان مبدأ را ثبت کنید؛ دریافت بیش از مقدار ارسال‌شده مجاز نیست.");
                item.ReceivedAtHubQuantity += dto.Quantity;
                var sourceOrders = b.Checkout!.Orders.Where(o => SourceGroup(b, o.FarmId)?.PointCode == group!.PointCode && o.Status.Code != AgriculturalOrderStatuses.Rejected);
                if (sourceOrders.SelectMany(o => o.AgriculturalOrderItems).Where(i => !i.IsDeleted).All(i => i.ReceivedAtHubQuantity == i.Quantity)) leg.Status = "Arrived";
            }
        }
        else
        {
            item.ReceivedAtHubQuantity += dto.Quantity;
            item.ReceivedAtOriginQuantity = item.ReceivedAtHubQuantity;
        }
        item.DeliveryVersion = Guid.NewGuid(); order.Version = Guid.NewGuid();
        Event(b, dto.Stage == "Origin" && interHub ? "OriginReceived" : "HubReceived", $"{item.Code}: {dto.Quantity}");
        if (dto.Stage != "Origin" || !interHub)
            await notices.AddForUserAsync(b.BuyerId, "بار به میدان دریافت رسید", $"تعداد {dto.Quantity} از {item.ProductNameSnapshot} در {(b.DestinationPoint ?? b.Point).Name} دریافت شد. رسیدن به میدان به معنی تحویل به شما نیست.");
        await unit.SaveChangesAsync(); await tx.CommitAsync();
    }
    public async Task CreateBatch(string code, DeliveryBatchInput dto)
    {
        RequireManager(); var id = UserId();
        if (dto.Items.Count is < 1 or > 200 || dto.Items.Select(x => x.ItemCode).Distinct().Count() != dto.Items.Count ||
            dto.ExpectedAt < DateTimeOffset.UtcNow.AddMinutes(-5) || dto.ExpectedAt > DateTimeOffset.UtcNow.AddDays(90)) throw new BadRequestException("اقلام و زمان تحویل معتبر وارد کنید.");
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var b = await Find(code);
        if (b.Checkout == null || b.RequestedMethod != null) throw new ConflictException("خرید ثبت نشده یا تغییر روش در انتظار رسیدگی است.");
        if (b.DeferredFeeLimit.HasValue && !b.DeferredFeePaid.HasValue)
            throw new ConflictException("ابتدا هزینه حمل را تسویه کنید؛ مازاد سقف به تأیید خریدار نیاز دارد.");
        if (b.DestinationPointId.HasValue)
        {
            var remainingOrders = b.Checkout.Orders.Where(o => o.Status.Code != AgriculturalOrderStatuses.Rejected).ToList();
            var remainingItems = remainingOrders.SelectMany(o => o.AgriculturalOrderItems)
                .Where(i => !i.IsDeleted && i.DeliveredQuantity < i.Quantity).ToList();
            if (b.Batches.Any(x => Live(x.Status)) || remainingOrders.Any(o => !o.IsPaid || o.Status.Code != AgriculturalOrderStatuses.Shipped) ||
                dto.Items.Count != remainingItems.Count || remainingItems.Any(i => !dto.Items.Any(l => l.ItemCode == i.Code && l.Quantity == i.Quantity - i.DeliveredQuantity)))
                throw new ConflictException("تحویل این خرید تجمیعی است؛ پس از رسیدن تمام اقلام تأییدشده، یک محموله کامل ثبت کنید. ارسال جداگانه نیازمند هماهنگی و هزینه جدید است.");
        }
        // Only explicitly authorized company accounts can receive an assignment.
        var agent = await users.GetAll().Include(x => x.Role).Include(x => x.AdditionalRoles).ThenInclude(x => x.Role).SingleOrDefaultAsync(x => x.UserId == dto.AgentId);
        var agentRoles = agent == null ? [] : new[] { agent.Role.IsDeleted ? "" : agent.Role.Name }.Concat(agent.AdditionalRoles.Where(x => !x.IsDeleted && !x.Role.IsDeleted).Select(x => x.Role.Name)).ToArray();
        if (agent == null || dto.AgentId == b.BuyerId && !agentRoles.Contains("Manager") || !agentRoles.Any(x => x is "Admin" or "Manager" or "DeliveryAgent"))
            throw new BadRequestException("نماینده باید حساب مجاز تحویل شرکت داشته باشد.");
        var batch = new DeliveryBatch { AgentId = dto.AgentId, ExpectedAt = dto.ExpectedAt,
            Status = b.Method == "Pickup" ? "Ready" : "OutForDelivery" };
        var plan = string.IsNullOrEmpty(b.FarmPointsJson) ? new List<FarmDeliveryGroup>() : JsonSerializer.Deserialize<List<FarmDeliveryGroup>>(b.FarmPointsJson)!;
        if (!b.DestinationPointId.HasValue && plan.Count > 1)
        {
            var selectedFarms = b.Checkout.Orders.Where(o => o.AgriculturalOrderItems.Any(i => dto.Items.Any(l => l.ItemCode == i.Code))).Select(o => o.FarmId).ToList();
            if (plan.Count(g => g.FarmIds.Any(id => selectedFarms.Contains(id))) > 1)
                throw new BadRequestException("برای هر میدان بار محموله جدا ثبت کنید.");
        }
        foreach (var line in dto.Items)
        {
            var item = b.Checkout.Orders.SelectMany(x => x.AgriculturalOrderItems).SingleOrDefault(x => x.Code == line.ItemCode)
                ?? throw new NotFoundException("قلم متعلق به این خرید نیست.");
            var order = b.Checkout.Orders.Single(x => x.AgriculturalOrderId == item.AgriculturalOrderId);
            var reserved = b.Batches.Where(x => Live(x.Status)).SelectMany(x => x.Items).Where(x => x.AgriculturalOrderItemId == item.AgriculturalOrderItemId).Sum(x => x.Quantity);
            if (!order.IsPaid || order.Status.Code != AgriculturalOrderStatuses.Shipped || line.Quantity <= 0 ||
                line.Quantity > item.ReceivedAtHubQuantity - item.DeliveredQuantity - reserved)
                throw new ConflictException("اقلام باید پرداخت‌شده، ارسال‌شده و در میدان موجود باشند؛ تعداد رزروشده یا تحویل‌شده قابل تخصیص دوباره نیست.");
            batch.Items.Add(new() { OrderItem = item, Quantity = line.Quantity });
            item.DeliveryVersion = Guid.NewGuid();
        }
        var localLeg = b.Legs.SingleOrDefault(l => l.Kind == "Local");
        if (localLeg != null) localLeg.Status = "InTransit";
        b.Batches.Add(batch); Event(b, "BatchCreated", $"محموله {batch.Code}، نماینده {dto.AgentId}، زمان {dto.ExpectedAt:O}");
        await notices.AddForUserAsync(b.BuyerId, b.Method == "Pickup" ? "بار آماده دریافت است" : "بار در مسیر شماست",
            $"تحویل {batch.Code} برای {dto.ExpectedAt:yyyy-MM-dd HH:mm zzz} آماده شد. فهرست اقلام را در سفارش بررسی کنید و کد را فقط پس از دریافت به نماینده بدهید.");
        await unit.SaveChangesAsync(); await tx.CommitAsync();
    }
    private static DeliveryBatch Batch(DeliveryBooking b, string code) => b.Batches.SingleOrDefault(x => x.Code == code)
        ?? throw new NotFoundException("محموله یافت نشد.");
    private byte[] Hash(string batch, string code)
    {
        var key = config["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(key) || Encoding.UTF8.GetByteCount(key) < 32) throw new InvalidOperationException("Delivery code signing key is not configured.");
        return HMACSHA256.HashData(Encoding.UTF8.GetBytes(key), Encoding.UTF8.GetBytes($"delivery:{batch}:{code}"));
    }
    private string PurchaseCode(DeliveryBooking booking) =>
        (System.Buffers.Binary.BinaryPrimitives.ReadUInt32BigEndian(Hash(booking.Code, "purchase-delivery-v1")) % 1_000_000).ToString("D6", CultureInfo.InvariantCulture);
    public async Task<object> PurchaseDeliveryCode(string booking)
    {
        var b = await Find(booking, true);
        if (b.Checkout == null) throw new ConflictException("ابتدا خرید را ثبت کنید.");
        return new { Code = PurchaseCode(b) };
    }
    public async Task<DeliveryCodeDto> IssueCode(string booking, string batchCode)
    {
        var b = await Find(booking, true);
        if (b.Checkout == null) throw new ConflictException("ابتدا خرید را ثبت کنید.");
        Batch(b, batchCode);
        return new(PurchaseCode(b), DateTimeOffset.MaxValue);
    }

    public async Task Verify(string booking, string batchCode, string code)
    {
        var id = UserId(); await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var b = await Find(booking); var batch = Batch(b, batchCode);
        if (!Manager && (b.BuyerId == id || !Agent || batch.AgentId != id)) throw new ForbiddenException("فقط مسئول همین تحویل یا مدیریت مجاز است.");
        if (batch.Status == "Completed") return; // A repeated successful request cannot release funds twice.
        if (batch.Status is not ("Ready" or "OutForDelivery") || batch.FailedAttempts >= 5)
            throw new ConflictException("محموله غیرقابل تحویل است یا کد مسدود شده است.");
        var completing = b.Batches.Where(x => x.Status is "Ready" or "OutForDelivery").ToList();
        if (!Manager && completing.Any(x => x.AgentId != id))
            throw new ForbiddenException("تأیید کامل خرید با چند نماینده باید توسط مدیریت انجام شود.");
        var deliveryLines = completing.SelectMany(x => x.Items).ToList();
        var remaining = b.Checkout!.Orders.Where(o => o.Status.Code != AgriculturalOrderStatuses.Rejected)
            .SelectMany(o => o.AgriculturalOrderItems).Where(i => !i.IsDeleted && i.Quantity > i.DeliveredQuantity).ToList();
        if (remaining.Any(i => deliveryLines.Where(l => l.OrderItem.AgriculturalOrderItemId == i.AgriculturalOrderItemId).Sum(l => l.Quantity) != i.Quantity - i.DeliveredQuantity))
            throw new ConflictException("کد خرید فقط برای تحویل کامل همهٔ اقلام باقی‌مانده قابل استفاده است؛ فهرست محموله باید کامل شود.");
        if (code.Length != 6 || !code.All(char.IsAsciiDigit) || !CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(code), Encoding.UTF8.GetBytes(PurchaseCode(b))))
        {
            batch.FailedAttempts++; batch.Version = Guid.NewGuid(); Event(b, "CodeRejected", $"کد نامعتبر برای {batch.Code}");
            await unit.SaveChangesAsync(); await tx.CommitAsync(); throw new BadRequestException("کد تحویل نادرست است.");
        }
        var delivered = await statuses.GetAll().SingleOrDefaultAsync(x => x.Code == AgriculturalOrderStatuses.Delivered && x.EntityStatus == EntityStatus.AgriculturalOrderStatus)
            ?? throw new NotFoundException("وضعیت تحویل یافت نشد.");
        foreach (var line in deliveryLines)
        {
            var item = line.OrderItem;
            if (line.Quantity > item.Quantity - item.DeliveredQuantity) throw new ConflictException("تعداد تحویل بیش از سفارش است.");
            item.DeliveredQuantity += line.Quantity; item.DeliveryVersion = Guid.NewGuid();
        }
        foreach (var order in b.Checkout!.Orders.Where(o => deliveryLines.Any(i => i.OrderItem.AgriculturalOrderId == o.AgriculturalOrderId)))
        {
            if (!order.IsPaid || order.Status.Code != AgriculturalOrderStatuses.Shipped) throw new ConflictException("وضعیت سفارش برای تحویل معتبر نیست.");
            var income = await incomes.GetAll().SingleOrDefaultAsync(x => x.AgriculturalOrderId == order.AgriculturalOrderId)
                ?? throw new ConflictException("درآمد سفارش نیازمند بررسی مالی است.");
            income.ReleasedAmount = Math.Max(income.ReleasedAmount, ReleaseFor(order, income)); income.Version = Guid.NewGuid();
            var full = order.AgriculturalOrderItems.All(x => x.IsDeleted || x.DeliveredQuantity == x.Quantity);
            var previous = order.Status.Code;
            if (full) { income.ReleasedAt = DateTimeOffset.UtcNow; order.Status = delivered; order.StatusId = delivered.StatusId; order.DeliveredAt = DateTimeOffset.UtcNow; order.DeliveredById = id; }
            order.Version = Guid.NewGuid();
            order.History.Add(new() { Action = "DeliveryCodeVerified", ActorId = id, FromStatusCode = previous,
                ToStatusCode = order.Status.Code, Reason = $"تحویل با کد خریدار؛ محموله {batch.Code}" });
            await notices.AddForUserAsync(income.SellerId, NotificationTypes.OrderDelivered, $"دریافت اقلام سفارش {order.Code} با کد خریدار ثبت شد و درآمد همان اقلام آزاد شد.");
        }
        foreach (var completed in completing) {
            completed.Status = "Completed"; completed.CompletedAt = DateTimeOffset.UtcNow; completed.CompletedById = id;
            completed.CodeHash = null; completed.CodeExpiresAt = null; completed.Version = Guid.NewGuid();
        }
        var localLeg = b.Legs.SingleOrDefault(l => l.Kind == "Local");
        if (localLeg != null) localLeg.Status = "Arrived";
        Event(b, "Completed", $"تحویل {batch.Code} با کد خریدار توسط نماینده {id}");
        await notices.AddForUserAsync(b.BuyerId, NotificationTypes.OrderDelivered, $"تحویل محموله {batch.Code} با کد شما ثبت شد.");
        await unit.SaveChangesAsync(); await tx.CommitAsync();
    }
    public async Task BatchAction(string booking, string batchCode, string action, string note)
    {
        var id = UserId(); if (string.IsNullOrWhiteSpace(note) || note.Length > 1000) throw new BadRequestException("توضیح الزامی است.");
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var b = await Find(booking); var batch = Batch(b, batchCode);
        if (!Live(batch.Status)) throw new ConflictException("محموله قابل تغییر نیست.");
        if (action == "Dispute")
        {
            if (b.BuyerId != id) throw new ForbiddenException("فقط خریدار مجاز است.");
            batch.Status = "Disputed";
        }
        else if (action == "Fail")
        {
            if ((!Manager && (!Agent || batch.AgentId != id)) || batch.Status == "Disputed") throw new ForbiddenException("برای این عملیات مجاز نیستید.");
            batch.Status = "Failed";
        }
        else if (action == "Cancel") { RequireManager(); batch.Status = "Cancelled"; }
        else throw new BadRequestException("عملیات نامعتبر است.");
        batch.Note = note.Trim(); batch.CodeHash = null; batch.CodeExpiresAt = null; batch.Version = Guid.NewGuid();
        Event(b, action, $"{batch.Code}: {note.Trim()}");
        await notices.AddForUserAsync(b.BuyerId, "وضعیت تحویل تغییر کرد", $"محموله {batch.Code}: {note.Trim()}");
        if (action == "Dispute")
        {
            await notices.AddForUserAsync(batch.AgentId, "مشکل در دریافت بار", $"خریدار برای محموله {batch.Code} مشکل ثبت کرد: {note.Trim()}. تأیید تحویل متوقف است.");
        }
        await unit.SaveChangesAsync(); await tx.CommitAsync();
    }
    public async Task RequestChange(string code, DeliveryChangeInput dto)
    {
        var id = UserId(); await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var b = await Find(code, true);
        if (b.DeferredFeeLimit.HasValue && !b.DeferredFeePaid.HasValue)
            throw new ConflictException("پیش از تغییر روش دریافت، هزینه حمل اولیه را تسویه کنید.");
        if (b.Checkout == null || !b.Checkout.IsSubmitted || !b.Checkout.Orders.Any(x => x.IsPaid) || b.Method != "Pickup" || dto.Method != "Direct" || b.Batches.Any(x => Live(x.Status)) ||
            b.Checkout.Orders.SelectMany(x => x.AgriculturalOrderItems).Any(x => x.DeliveredQuantity > 0)) throw new ConflictException("تغییر روش فقط قبل از تخصیص یا تحویل بار مجاز است؛ ابتدا با پشتیبانی هماهنگ کنید.");
        b.RequestedMethod = dto.Method; b.ChangeReason = dto.Reason; b.ChangeFee = null;
        Event(b, "ChangeRequested", dto.Reason); await unit.SaveChangesAsync(); await tx.CommitAsync();
    }
    public async Task PriceChange(string code, decimal fee)
    {
        RequireManager(); Money(fee); await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var b = await Find(code); if (b.RequestedMethod == null || b.RequestedMethod == "Pickup" && fee != 0) throw new ConflictException("درخواست تغییر معتبر نیست؛ دریافت از میدان هزینه جدید ندارد.");
        b.ChangeFee = fee; Event(b, "ChangeQuoted", $"هزینه اضافه: {fee}");
        await notices.AddForUserAsync(b.BuyerId, "هزینه تغییر تحویل", $"هزینه تغییر تحویل {b.Code} مشخص شد؛ پیش از اعزام آن را بررسی و تأیید کنید.");
        await unit.SaveChangesAsync(); await tx.CommitAsync();
    }
    public async Task PriceRetry(string code, DeliveryRetryPriceInput dto)
    {
        RequireManager(); Money(dto.Fee);
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var b = await Find(code);
        if (b.Method != "Direct" || b.RequestedMethod != null || b.Checkout == null ||
            b.Batches.Any(x => Live(x.Status)) || !b.Batches.Any(x => x.Status == "Failed") ||
            !b.Checkout.Orders.SelectMany(x => x.AgriculturalOrderItems).Any(x => x.DeliveredQuantity < x.Quantity))
            throw new ConflictException("ابتدا تحویل ناموفق و اقلام باقی‌مانده را بررسی کنید.");
        b.RequestedMethod = "Direct"; b.ChangeReason = dto.Note; b.ChangeFee = dto.Fee;
        Event(b, "RetryQuoted", $"هزینه ارسال مجدد {dto.Fee}؛ {dto.Note}");
        await notices.AddForUserAsync(b.BuyerId, "سفارش در انتظار هماهنگی مجدد", $"هزینه ارسال مجدد تحویل {b.Code} مشخص شد؛ برای اعزام دوباره آن را بررسی و تأیید کنید.");
        await unit.SaveChangesAsync(); await tx.CommitAsync();
    }
    public async Task AcceptChange(string code, decimal expectedFee)
    {
        var id = UserId(); await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var b = await Find(code, true);
        if (b.RequestedMethod == null || !b.ChangeFee.HasValue || b.ChangeFee != expectedFee) throw new ConflictException("ابتدا هزینه تغییر باید مشخص شود.");
        var fee = b.ChangeFee.Value;
        if (fee > 0)
        {
            var wallet = await wallets.GetAll().SingleOrDefaultAsync(x => x.UserId == id) ?? throw new BadRequestException("کیف پول یافت نشد.");
            if (wallet.Balance - wallet.HeldAmount < fee) throw new BadRequestException("موجودی آزاد کیف پول برای هزینه اضافه کافی نیست.");
            wallet.Balance -= fee;
            await transactions.AddAsync(new() { WalletId = wallet.WalletId, Amount = fee, TransactionType = WalletTransactionType.Withdrawal,
                ReferenceId = "DELIVERY_" + b.Code + "_" + Guid.NewGuid().ToString("N"), Description = "هزینه اضافه تغییر تحویل " + b.Code });
        }
        Event(b, "ChangeAccepted", $"{b.Method} → {b.RequestedMethod}؛ هزینه اضافه {fee}");
        if (b.DestinationPointId.HasValue)
        {
            var local = b.Legs.SingleOrDefault(l => l.Kind == "Local");
            if (local == null) b.Legs.Add(new DeliveryLeg { OriginPointId = b.DestinationPointId.Value, Kind = "Local",
                Fee = fee, IsManualPrice = true, RouteSnapshot = $"{b.DestinationPoint!.Name} ← نشانی خریدار" });
            else { local.Fee = (local.Fee ?? 0) + fee; local.IsManualPrice = true; }
        }
        b.Fee = (b.Fee ?? 0) + fee;
        b.Method = b.RequestedMethod; b.RequestedMethod = null; b.ChangeFee = null; b.ChangeReason = null;
        await unit.SaveChangesAsync(); await tx.CommitAsync();
    }
    public async Task CancelChange(string code)
    {
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var b = await Find(code, true); b.RequestedMethod = null; b.ChangeFee = null; b.ChangeReason = null;
        Event(b, "ChangeCancelled", "لغو درخواست تغییر روش"); await unit.SaveChangesAsync(); await tx.CommitAsync();
    }
}
