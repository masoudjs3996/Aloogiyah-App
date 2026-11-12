using System.Data;
using System.Text.Json;
using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Application.DTOs.Wallet;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Application.Services.Store;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Persistence;
using AlooGiyah_Persistence.Context;
using AlooGiyah_Persistence.Queries;
using AlooGiyah_Persistence.Repositories;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using Dapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Npgsql;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Http;

foreach (var role in new[] { "Admin", "Manager", "Farmer", "Expert", "DeliveryAgent" })
{
    var requirement = new RolesAuthorizationRequirement([role]);
    var managerContext = new AuthorizationHandlerContext([requirement], new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Role, "User"), new Claim(ClaimTypes.Role, "Manager")], "test")), null);
    await new AlooGiyah_Api.Authorization.ManagerRoleHandler().HandleAsync(managerContext);
    Check(managerContext.HasSucceeded, "Manager additional role did not satisfy panel role: " + role);
    var anonymousContext = new AuthorizationHandlerContext([requirement], new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Role, "Manager")])), null);
    await new AlooGiyah_Api.Authorization.ManagerRoleHandler().HandleAsync(anonymousContext);
    Check(!anonymousContext.HasSucceeded, "Anonymous manager claim bypassed authentication");
}
Console.WriteLine("PASS: authenticated Manager has all role permissions, including as an additional role; anonymous claims are rejected.");

using var configured = new AlooGiyahDesignTimeFactory().CreateDbContext([]);
var adminSettings = new NpgsqlConnectionStringBuilder(Environment.GetEnvironmentVariable("MODEL_INTEGRITY_ADMIN_CONNECTION") ?? configured.Database.GetConnectionString());
Check(adminSettings.Host is "localhost" or "127.0.0.1" or "::1", "Only local PostgreSQL is allowed");
adminSettings.Database = "postgres";
var name = "interhub_test_" + Guid.NewGuid().ToString("N");
await using var admin = new NpgsqlConnection(adminSettings.ConnectionString);
await admin.OpenAsync(); await admin.ExecuteAsync($"CREATE DATABASE \"{name}\"");
try
{
    var connection = new NpgsqlConnectionStringBuilder(adminSettings.ConnectionString) { Database = name }.ConnectionString;
    await using var db = new AlooGiyahDbContext(new DbContextOptionsBuilder<AlooGiyahDbContext>().UseNpgsql(connection).Options);
    await db.GetService<IMigrator>().MigrateAsync("20261105161947_RelationalIntegrityCleanup");
    string legacyItemCode, legacyBookingCode;
    await using (var legacy = new AlooGiyahDbContext(new DbContextOptionsBuilder<AlooGiyahDbContext>().UseNpgsql(connection)
        .UseModel(SchemaModels.BeforeInterHub(db)).ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)).Options))
    {
        var owner = new User { UserName = "legacy-owner", Role = new Role { RoleId = 900, Name = "legacy" } };
        var status = new Status { Name = "legacy", EntityStatus = EntityStatus.FarmStatus };
        var point = new DeliveryPoint { Name = "legacy point", DirectFee = 17 };
        var oldProvince = new Province { Name = "legacy province", Status = status };
        var county = new County { Name = "legacy county", Province = oldProvince, Status = status };
        var farm = new Farm { Name = "legacy farm", Owner = owner, Status = status, DeliveryPointCode = point.Code };
        var product = new AgriculturalProduct { Name = "legacy plant", Farm = farm, Status = status };
        var item = new AgriculturalOrderItem { AgriculturalProduct = product, Quantity = 3, ReceivedAtHubQuantity = 2, Price = 10 };
        var order = new AgriculturalOrder { Buyer = owner, Farm = farm, Status = status, TotalPrice = 30,
            Address = new Address { User = owner, Province = oldProvince, County = county }, AgriculturalOrderItems = [item] };
        var booking = new DeliveryBooking { BuyerId = 0, Point = point, CartId = Guid.NewGuid(), Fee = 17, PointSnapshot = "legacy point snapshot", Window = "legacy window" };
        legacy.AddRange(order, point); await legacy.SaveChangesAsync();
        booking.BuyerId = owner.UserId; legacy.Add(booking); await legacy.SaveChangesAsync();
        legacyItemCode = item.Code; legacyBookingCode = booking.Code;
    }
    await db.GetService<IMigrator>().MigrateAsync("20261106120345_ProductSaleUnits");
    var legacyProduct = await db.AgriculturalProducts.SingleAsync();
    var legacyOrder = await db.AgriculturalOrders.SingleAsync();
    var existingUnitProducts = new[] { "Package", "Piece", "Kilogram" }.Select(unit => new AgriculturalProduct
    {
        Name = "existing " + unit, FarmId = legacyProduct.FarmId, StatusId = legacyProduct.StatusId, SaleUnit = unit
    }).ToArray();
    foreach (var product in existingUnitProducts)
        db.Add(new AgriculturalOrderItem { AgriculturalProduct = product, AgriculturalOrder = legacyOrder,
            SaleUnit = product.SaleUnit, Quantity = 1, Price = 10 });
    var oldEmptyOrder = new Order { UserId = legacyOrder.BuyerId, StatusId = legacyOrder.StatusId };
    var oldPaidEmptyOrder = new Order { UserId = legacyOrder.BuyerId, StatusId = legacyOrder.StatusId, IsPaid = true };
    db.AddRange(oldEmptyOrder, oldPaidEmptyOrder);
    await db.SaveChangesAsync();
    await db.Database.MigrateAsync();
    await db.Entry(oldEmptyOrder).ReloadAsync();
    await db.Entry(oldPaidEmptyOrder).ReloadAsync();
    Check(oldEmptyOrder.IsDeleted && !oldPaidEmptyOrder.IsDeleted, "Empty-order migration changed the wrong historical records");
    await db.Entry(legacyProduct).ReloadAsync();
    var oldItem = await db.AgriculturalOrderItems.SingleAsync(i => i.Code == legacyItemCode);
    var oldBooking = await db.DeliveryBookings.SingleAsync(b => b.Code == legacyBookingCode);
    Check(legacyProduct.SaleUnit == "Kilogram" && oldItem.SaleUnit == "Kilogram", "Missing legacy units were not backfilled");
    foreach (var product in existingUnitProducts)
    {
        var expectedUnit = product.SaleUnit;
        await db.Entry(product).ReloadAsync();
        Check(product.SaleUnit == expectedUnit && await db.AgriculturalOrderItems
            .Where(i => i.AgriculturalProductId == product.AgriculturalProductId).AllAsync(i => i.SaleUnit == expectedUnit),
            "Backfill overwrote an existing sale unit");
    }
    Console.WriteLine("PASS: missing product/order units become Kilogram; Package, Piece and existing Kilogram units are preserved.");
    Check(oldItem.ReceivedAtHubQuantity == 2 && oldItem.ReceivedAtOriginQuantity == 2 && oldBooking.Fee == 17 &&
        oldBooking.DestinationPointId == null && oldBooking.PointSnapshot == "legacy point snapshot", "Migration changed legacy delivery data");
    Console.WriteLine("PASS: populated old-schema upgrade preserves receipts, fees and historical destinations.");
    Check(!db.Database.HasPendingModelChanges(), "Snapshot mismatch");
    GenericRepository<T> R<T>() where T : BaseEntity => new(db);
    Status S(string code, string title, EntityStatus kind = EntityStatus.AgriculturalOrderStatus)
    {
        var s = new Status { Name = title, EntityStatus = kind }; db.Add(s); db.Entry(s).Property(x => x.Code).CurrentValue = code; return s;
    }
    var pending = S(AgriculturalOrderStatuses.PendingPayment, "pending");
    var shipped = S(AgriculturalOrderStatuses.Shipped, "shipped");
    var delivered = S(AgriculturalOrderStatuses.Delivered, "delivered");
    var productStatus = S("251BC4A57D", "sellable", EntityStatus.AgriculturalProduct);
    var farmStatus = S("14ACE65804", "farm", EntityStatus.FarmStatus);
    var locationStatus = S("TESTLOC001", "location", EntityStatus.Location);
    var managerRole = new Role { Name = "Manager" };
    var buyer = new User { UserName = "buyer", Role = managerRole, FName = "buyer" };
    var agent = new User { UserName = "agent", Role = managerRole, FName = "agent" };
    var province = new Province { Name = "province", Status = locationStatus };
    var tehran = new County { Name = "Tehran", Province = province, Status = locationStatus };
    var mashhad = new County { Name = "Mashhad", Province = province, Status = locationStatus };
    var shiraz = new County { Name = "Shiraz", Province = province, Status = locationStatus };
    var a = new DeliveryPoint { Name = "تهران", County = tehran, DirectFee = 20 };
    var b = new DeliveryPoint { Name = "مشهد", County = mashhad, DirectFee = 30 };
    var c = new DeliveryPoint { Name = "شیراز", County = shiraz, DirectFee = 40 };
    var addressA = new Address { User = buyer, Province = province, County = tehran, Street = "street A" };
    var addressB = new Address { User = buyer, Province = province, County = mashhad, Street = "street B" };
    var ab = new DeliveryRoute { OriginPoint = a, DestinationPoint = b, Fee = 120, TransitDays = 2, MaxQuantity = 10 };
    var cb = new DeliveryRoute { OriginPoint = c, DestinationPoint = b, Fee = 80, TransitDays = 3 };
    Farm F(string label, DeliveryPoint point) => new() { Name = label, Owner = agent, Status = farmStatus, DeliveryPointCode = point.Code };
    var farms = new[] { F("A1", a), F("A2", a), F("C1", c), F("B1", b) };
    var products = farms.Select((farm, i) => new AgriculturalProduct { Name = "plant" + i, Farm = farm, Status = productStatus,
        SaleUnit = new[]{"Kilogram","Package","Piece","Kilogram"}[i], RetailPrice = 100 * (i + 1), WholesalePrice = 80 * (i + 1), Stock = 1000, Categories = [], Offers = [] }).ToArray();
    db.AddRange(buyer, agent, a, b, c, addressA, addressB, ab, cb); db.AddRange(products); await db.SaveChangesAsync();
    var actor = new Actor(buyer.UserId);
    var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Jwt:Key"] = new('k', 64) }).Build();
    var notices = new Notices(); var unit = new UnitOfWork(db);
    var mapper = new MapperConfiguration(m => { m.AddProfile<AlooGiyah_Application.Mappings.Profile>(); m.AddProfile<AlooGiyah_Application.Mappings.AgriculturalOrderProfile>(); }, NullLoggerFactory.Instance).CreateMapper();
    var factory = new Connections(connection);
    var legacyStatus = S("TESTORDER1", "legacy order", EntityStatus.OrderStatus);
    var storeProduct = new Product { Name = "store product", Stock = 10, RetailPrice = 100 };
    Order StoreOrder(bool paid, params int[] quantities) => new()
    {
        User = buyer, Status = legacyStatus, IsPaid = paid,
        OrderItems = quantities.Select(q => new OrderItem { Product = storeProduct, Quantity = q, Price = q * 100, PriceType = "Retail" }).ToList()
    };
    var storeOrder = StoreOrder(false, 1, 2);
    var removedThroughUpdate = StoreOrder(false, 3);
    var removedThroughSql = StoreOrder(false, 1);
    var paidStoreOrder = StoreOrder(true, 1);
    db.AddRange(storeOrder, removedThroughUpdate, removedThroughSql, paidStoreOrder);
    await db.SaveChangesAsync();
    var storeOrderQuery = new OrderQuery(factory, actor);
    var storeOrders = new OrderService(storeOrderQuery, R<Order>(), R<OrderItem>(), R<Product>(),
        R<Status>(), R<Address>(), R<Discount>(), notices, new AlooGiyah_Application.Services.PriceCalculatorService(R<AgriculturalProduct>(), config), actor, unit, mapper);
    await Expect<BadRequestException>(() => storeOrders.CreateAsync(new() { Items = [] }));
    await Expect<BadRequestException>(() => storeOrders.CreateAsync(new() { Items = [new() { Quantity = 0 }] }));
    await Expect<PostgresException>(() => db.Database.ExecuteSqlInterpolatedAsync($"""
        INSERT INTO "Orders" ("UserId", "StatusId", "Code", "CreatedAt", "TotalPrice", "DiscountAmount", "IsPaid", "IsDeleted")
        VALUES ({buyer.UserId}, {legacyStatus.StatusId}, 'EMPTYORDER', now(), 0, 0, false, false)
        """));
    var requestContext = new DefaultHttpContext
    {
        User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, buyer.UserId.ToString())], "test"))
    };
    var storeItems = new OrderItemService(new OrderItemQuery(factory, actor), R<OrderItem>(), R<Order>(), R<Product>(),
        unit, mapper, new HttpContextAccessor { HttpContext = requestContext });
    var itemIds = storeOrder.OrderItems.OrderBy(i => i.Quantity).Select(i => i.OrderItemId).ToArray();
    Check(await storeItems.DeleteAsync(itemIds[0]) && !storeOrder.IsDeleted && storeOrder.TotalPrice == 200 && storeProduct.Stock == 11,
        "Removing one item should retain the order and restore its stock");
    Check(await storeItems.DeleteAsync(itemIds[1]) && storeOrder.IsDeleted && storeProduct.Stock == 13 &&
        await storeOrderQuery.GetByCodeAsync(storeOrder.Code) == null, "Removing the last item left a visible empty order");
    Check(await storeOrders.UpdateAsync(new() { OrderCode = removedThroughUpdate.Code, Items = [] }) &&
        removedThroughUpdate.IsDeleted && storeProduct.Stock == 16, "An empty update did not remove the order and restore stock");
    await Expect<ConflictException>(() => storeItems.DeleteAsync(paidStoreOrder.OrderItems.Single().OrderItemId));
    await Expect<PostgresException>(() => db.Database.ExecuteSqlInterpolatedAsync($"""
        DELETE FROM "OrderItems" WHERE "OrderId" = {paidStoreOrder.OrderId}
        """));
    await db.Database.ExecuteSqlInterpolatedAsync($"""
        UPDATE "OrderItems" SET "IsDeleted" = true WHERE "OrderId" = {removedThroughSql.OrderId}
        """);
    Check((await db.Orders.AsNoTracking().SingleAsync(o => o.OrderId == removedThroughSql.OrderId)).IsDeleted,
        "Database did not remove the empty unpaid order");
    Console.WriteLine("PASS: empty orders rejected, last item removes unpaid order, stock restored and paid records protected.");
    var service = new DeliveryService(R<DeliveryPoint>(), R<DeliveryBooking>(), R<Cart>(), R<Address>(), R<Status>(), R<SellerReceivable>(),
        R<User>(), R<Wallet>(), R<WalletTransaction>(), actor, unit, notices, config, R<Checkout>(), R<Farm>(), R<DeliveryRoute>(), R<County>(), R<DeliveryCategoryTariff>(), R<Category>());
    var checkout = new CheckoutService(new CheckoutQuery(factory, actor, mapper), R<Checkout>(), R<Cart>(), R<CartItem>(), R<Discount>(), R<Status>(),
        R<AgriculturalProduct>(), R<Address>(), R<Wallet>(), R<WalletTransaction>(), notices, actor, unit, mapper, config,
        R<DeliveryBooking>(), R<DeliveryPoint>(), R<DeliveryRoute>(), R<Category>());
    async Task<Cart> CartFor(params (int index, int quantity)[] lines)
    {
        var cart = new Cart { UserId = buyer.UserId, CartItems = lines.Select(l => new CartItem { AgriculturalProductId = products[l.index].AgriculturalProductId, Quantity = l.quantity, Price = products[l.index].RetailPrice }).ToList() };
        db.Add(cart); await db.SaveChangesAsync(); return cart;
    }
    Task<DeliveryBookingDto> Quote(Cart cart, DeliveryPoint dest, string method, Address? address = null) =>
        service.Quote(new(cart.CartId, (address ?? addressB).Code, dest.Code, method, "با هماهنگی شرکت"));
    var local = await CartFor((0, 2));
    Check((await Quote(local, a, "Pickup", addressA)).Fee == 0, "Same-field pickup must cost zero");
    Check((await Quote(local, a, "Direct", addressA)).Fee == 20, "Same-field direct must charge local fee only");
    Check((await Quote(local, b, "Pickup")).Fee == 120, "Intercity pickup must retain inter-hub fee");
    Check((await Quote(local, b, "Direct")).Fee == 150, "Intercity direct must sum both legs");
    var automatic = await service.Quote(new(local.CartId, addressB.Code, null, "Direct", "با هماهنگی شرکت"));
    Check(automatic.DestinationCode == b.Code && automatic.Fee == 150, "Home delivery must select a reachable hub in the address county");
    var automaticLocal = await service.Quote(new(local.CartId, addressA.Code, null, "Direct", "با هماهنگی شرکت"));
    Check(automaticLocal.DestinationCode == a.Code && automaticLocal.Fee == 20, "Automatic local delivery must not add an intercity leg");
    b.CountyId = null; await db.SaveChangesAsync();
    await Expect<BadRequestException>(() => service.Quote(new(local.CartId, addressB.Code, null, "Direct", "با هماهنگی شرکت")));
    b.CountyId = mashhad.CountyId; await db.SaveChangesAsync();
    await Expect<BadRequestException>(() => service.Quote(new(local.CartId, addressB.Code, null, "Pickup", "با هماهنگی شرکت")));
    farms[0].DeliveryPointCode = null; await db.SaveChangesAsync();
    await Expect<BadRequestException>(() => service.Quote(new(local.CartId, addressB.Code, null, "Direct", "با هماهنگی شرکت")));
    farms[0].DeliveryPointCode = a.Code; await db.SaveChangesAsync();
    await Expect<BadRequestException>(() => Quote(local, c, "Pickup"));
    var reverse = await CartFor((3, 1));
    await Expect<BadRequestException>(() => Quote(reverse, a, "Pickup"));
    var outside = await Quote(local, a, "Direct", addressB);
    Check(outside.Fee == null && outside.Legs.Single().Kind == "Local", "Out-of-county address cannot use the flat local fee");
    Console.WriteLine("PASS: four delivery cases, directed routes, out-of-area pricing.");

    var multi = await CartFor((0, 2), (1, 3), (2, 4), (3, 1));
    var quote = await Quote(multi, b, "Direct");
    Check(quote.Fee == 230 && quote.Legs.Count(l => l.Kind == "InterHub") == 2 && quote.Legs.Count(l => l.Kind == "Local") == 1,
        "Shared origin or final trip was charged twice");
    var dests = JsonSerializer.SerializeToElement(await service.Destinations(multi.CartId));
    Check(dests.GetArrayLength() == 1 && dests[0].GetProperty("Code").GetString() == b.Code, "Destinations must cover every source");
    var catalog = new AgriculturalProductQuery(factory, actor, config);
    Check((await catalog.GetByFilterAsync(new() { DeliveryPointCode = a.Code }, "Manager")).TotalCount == 2, "Origin filter failed");
    Check((await catalog.GetByFilterAsync(new() { DestinationPointCode = b.Code }, "Manager")).TotalCount == 4, "Destination filter failed");
    Check((await catalog.GetByFilterAsync(new() { DestinationPointCode = a.Code }, "Manager")).TotalCount == 2, "Destination filter invented reverse routes");
    Check((await catalog.GetByFilterAsync(new() { DestinationPointCode = "MISSING123" }, "Manager")).TotalCount == 0, "Invalid field filter returned products");
    Check((await catalog.GetByCodeAsync(products[0].Code, "Manager"))!.SaleUnit == "Kilogram", "Catalog SQL lost unit");
    await Expect<PostgresException>(() => db.Database.ExecuteSqlRawAsync("UPDATE \"AgriculturalProducts\" SET \"SaleUnit\"='Ton'"));
    Console.WriteLine("PASS: origin consolidation, one local charge, common destinations and real SQL filters.");

    CheckoutFromCartDto Buy(Cart cart, DeliveryBookingDto q, string key) => new() { CartId = cart.CartId, AddressCode = addressB.Code,
        DeliveryBookingCode = q.Code, ExpectedDeliveryFee = q.Fee, IdempotencyKey = key, DiscountCode = "" };
    // A saved quote is invalidated when an automatically priced route changes.
    ab.Fee = 125; await db.SaveChangesAsync();
    await Expect<ConflictException>(() => checkout.CreateFromCartAsync(Buy(multi, quote, "stale-tariff-001")));
    ab.Fee = 120; ab.MaxQuantity = 4; await db.SaveChangesAsync();
    quote = await Quote(multi, b, "Direct");
    Check(quote.Fee == null, "Above-capacity shipment was priced automatically");
    await Expect<ConflictException>(() => checkout.CreateFromCartAsync(Buy(multi, quote, "no-price-001")));
    var unpriced = quote.Legs.Single(l => l.Fee == null);
    await service.PriceLeg(quote.Code, unpriced.Code, 140);
    var priced = await service.Get(quote.Code);
    Check(priced.Fee == 250, "Manual quote did not preserve known fees");
    await Expect<ConflictException>(() => checkout.CreateFromCartAsync(Buy(multi, quote, "old-acceptance-001")));
    cb.IsActive = false; await db.SaveChangesAsync();
    await Expect<ConflictException>(() => checkout.CreateFromCartAsync(Buy(multi, priced, "closed-route-001")));
    cb.IsActive = true; await db.SaveChangesAsync();
    var purchase = await checkout.CreateFromCartAsync(Buy(multi, priced, "valid-purchase-001"));
    var savedCheckout = await db.Checkouts.Include(x => x.Orders).ThenInclude(o => o.AgriculturalOrderItems).SingleAsync(x => x.Code == purchase.Code);
    var reservedOrderId = savedCheckout.Orders.First().AgriculturalOrderId;
    await Expect<PostgresException>(() => db.Database.ExecuteSqlInterpolatedAsync($"""
        DELETE FROM "AgriculturalOrderItems" WHERE "AgriculturalOrderId" = {reservedOrderId}
        """));
    Check(await db.AgriculturalOrderItems.AnyAsync(item => item.AgriculturalOrderId == reservedOrderId),
        "Deleting the last item of a checkout order lost its financial snapshot");
    Check(savedCheckout.Orders.SelectMany(o=>o.AgriculturalOrderItems).All(i=>i.SaleUnit == products.Single(p=>p.AgriculturalProductId==i.AgriculturalProductId).SaleUnit), "Purchase sale unit snapshot missing");
    Check(purchase.Orders.SelectMany(o=>o.OrderItems).All(i=>i.SaleUnit != null), "Order DTO lost unit snapshot");
    Check(savedCheckout.Orders.Sum(o => o.ShippingAmount) == 250, "Allocation lost or duplicated money");
    Check(savedCheckout.Orders.Single(o => o.FarmId == farms[0].FarmId).ShippingAmount == 62 &&
        savedCheckout.Orders.Single(o => o.FarmId == farms[1].FarmId).ShippingAmount == 93 &&
        savedCheckout.Orders.Single(o => o.FarmId == farms[2].FarmId).ShippingAmount == 92 &&
        savedCheckout.Orders.Single(o => o.FarmId == farms[3].FarmId).ShippingAmount == 3, "Shipping must follow units and source legs, not product prices");
    Check((await checkout.CreateFromCartAsync(Buy(multi, priced, "valid-purchase-001"))).Code == purchase.Code, "Idempotent checkout failed");
    await Expect<ConflictException>(() => service.PriceLeg(priced.Code, unpriced.Code, 150));
    Console.WriteLine("PASS: quote changes, unknown fees, capacity, active routes, allocation and checkout idempotency.");

    savedCheckout.IsSubmitted = true;
    foreach (var order in savedCheckout.Orders)
    {
        order.IsPaid = true; order.Status = shipped; order.StatusId = shipped.StatusId;
        db.Add(new SellerReceivable { Order = order, SellerId = agent.UserId, GrossAmount = order.Subtotal, NetAmount = order.Subtotal });
    }
    await db.SaveChangesAsync();
    actor.Id = agent.UserId;
    var lines = (await service.Get(priced.Code)).Items;
    var interLine = lines.First(i => i.InterHub);
    await Expect<ConflictException>(() => service.Receive(priced.Code, new(interLine.ItemCode, 1)));
    await Expect<ConflictException>(() => service.CreateBatch(priced.Code, new(agent.UserId, DateTimeOffset.UtcNow.AddHours(4), [new(interLine.ItemCode, 1)])));
    var transfer = priced.Legs.First(l => l.Kind == "InterHub");
    await Expect<ConflictException>(() => service.Dispatch(priced.Code, transfer.Code));
    foreach (var line in lines.Where(l => l.InterHub)) await service.Receive(priced.Code, new(line.ItemCode, line.Quantity, "Origin"));
    var trackedOrder = await new AgriculturalOrderQuery(factory, actor, mapper).GetByCodeAsync(interLine.OrderCode);
    Check(trackedOrder!.OrderItems.All(i => i.ReceivedAtOriginQuantity == i.Quantity && i.ReceivedAtHubQuantity == 0), "Order query lost origin-only receipts");
    foreach (var leg in priced.Legs.Where(l => l.Kind == "InterHub")) await service.Dispatch(priced.Code, leg.Code);
    await Expect<ConflictException>(() => service.Dispatch(priced.Code, transfer.Code));
    foreach (var line in lines) await service.Receive(priced.Code, new(line.ItemCode, line.Quantity));
    trackedOrder = await new AgriculturalOrderQuery(factory, actor, mapper).GetByCodeAsync(interLine.OrderCode);
    Check(trackedOrder!.OrderItems.All(i => i.ReceivedAtHubQuantity == i.Quantity && i.DeliveredQuantity == 0), "Order tracking did not expose full destination receipt separately from buyer delivery");
    Check((await service.Get(priced.Code)).Legs.Where(l => l.Kind == "InterHub").All(l => l.Status == "Arrived"), "Transfer arrival did not complete");
    Check(await db.SellerReceivables.SumAsync(i => i.ReleasedAmount) == 0, "Hub receipts released income");
    await Expect<ConflictException>(() => service.Receive(priced.Code, new(interLine.ItemCode, 1)));
    await service.CreateBatch(priced.Code, new(agent.UserId, DateTimeOffset.UtcNow.AddHours(4), lines.Select(l => new DeliveryLineInput(l.ItemCode, l.Quantity)).ToList()));
    var ready = await service.Get(priced.Code);
    Check(ready.Batches.Count == 1, "A shared destination must allow one batch from several origins");
    actor.Id = buyer.UserId;
    var code = JsonSerializer.SerializeToElement(await service.PurchaseDeliveryCode(priced.Code)).GetProperty("Code").GetString()!;
    actor.AssignedRoles = ["User"];
    await Expect<ForbiddenException>(() => service.Verify(priced.Code, ready.Batches[0].Code, code));
    actor.AssignedRoles = ["Manager"];
    await service.Verify(priced.Code, ready.Batches[0].Code, code);
    actor.Id = agent.UserId;
    actor.AssignedRoles = ["DeliveryAgent"];
    await service.Verify(priced.Code, ready.Batches[0].Code, code);
    actor.AssignedRoles = ["Manager"];
    trackedOrder = await new AgriculturalOrderQuery(factory, actor, mapper).GetByCodeAsync(interLine.OrderCode);
    Check(trackedOrder!.StatusCode == AgriculturalOrderStatuses.Delivered && trackedOrder.OrderItems.All(i => i.DeliveredQuantity == i.Quantity), "Final order tracking did not expose verified buyer delivery");
    var released = await db.SellerReceivables.SumAsync(i => i.ReleasedAmount);
    await service.Verify(priced.Code, ready.Batches[0].Code, code);
    Check(released == savedCheckout.Orders.Sum(o => o.Subtotal) && await db.SellerReceivables.SumAsync(i => i.ReleasedAmount) == released,
        "Final receipt must release goods income once, excluding all shipping");
    Check((await service.Get(priced.Code)).Legs.Single(l => l.Kind == "Local").Status == "Arrived", "Local trip did not complete");
    Console.WriteLine("PASS: origin/dispatch/destination flow, shared final batch, buyer authorization and one-time income release.");

    var checking = S(AgriculturalOrderStatuses.CheckingInventory, "checking");
    S(AgriculturalOrderStatuses.Approved, "approved");
    S(AgriculturalOrderStatuses.Rejected, "rejected");
    var wallet = new Wallet { User = buyer, Balance = 100_000 };
    db.Add(wallet); await db.SaveChangesAsync();
    var orderService = new AgriculturalOrderService(new AgriculturalOrderQuery(factory, actor, mapper), R<AgriculturalOrder>(),
        R<Status>(), R<AgriculturalProduct>(), R<OrderRefund>(), actor, checkout, unit, mapper, R<Wallet>(), R<WalletTransaction>(),
        R<Notification>(), notices, R<SellerReceivable>(), R<SettlementRates>());
    ab.Fee = null; ab.MaxQuantity = 10; b.DirectFee = null; await db.SaveChangesAsync();
    async Task<(CheckoutDto Purchase, DeliveryBookingDto Quote)> Deferred(string key, decimal cap)
    {
        actor.Id = buyer.UserId;
        var cart = await CartFor((0, 2), (2, 1));
        var q = await Quote(cart, b, "Direct");
        Check(q.Fee == null && q.KnownFee == 80 && q.HasUnpricedLegs, "Unknown quote lost known shipping");
        var input = Buy(cart, q, key); input.ExpectedDeliveryFee = q.KnownFee;
        await Expect<BadRequestException>(() => checkout.CreateFromCartAsync(input));
        input.ExpectedDeferredDeliveryFeeLimit = cap;
        var purchase = await checkout.CreateFromCartAsync(input);
        Check(purchase.DeferredDeliveryFeeLimit == cap, "Checkout did not disclose separate shipping cap");
        Check((await new CheckoutQuery(factory, actor, mapper).GetByCodeAsync(purchase.Code))!.DeferredDeliveryFeeLimit == cap,
            "SQL checkout reader lost the shipping cap");
        var available = wallet.Balance - wallet.HeldAmount;
        var beforeBalance = wallet.Balance; var beforeHold = wallet.HeldAmount;
        wallet.HeldAmount = wallet.Balance; await db.SaveChangesAsync();
        await Expect<BadRequestException>(() => checkout.PayWithWalletAsync(purchase.Code));
        wallet.HeldAmount = beforeHold; await db.SaveChangesAsync();
        await checkout.PayWithWalletAsync(purchase.Code);
        Check(wallet.Balance == beforeBalance && wallet.HeldAmount == beforeHold + purchase.PayableAmount + cap,
            "Goods and shipping cap must both be reserved without a debit");
        await checkout.PayWithWalletAsync(purchase.Code);
        Check(wallet.HeldAmount == beforeHold + purchase.PayableAmount + cap && available >= purchase.PayableAmount + cap, "Repeated pay duplicated a hold");
        return (purchase, await service.Get(q.Code));
    }
    async Task Approve(CheckoutDto purchase)
    {
        actor.Id = agent.UserId;
        foreach (var order in purchase.Orders) await orderService.ExecuteActionAsync(order.Code, new() { Action = AgriculturalOrderAction.Approve });
    }
    var initialBalance = wallet.Balance;
    var incomeBefore = await db.SellerReceivables.SumAsync(i => i.GrossAmount);
    var under = await Deferred("deferred-under-001", 200);
    await Expect<ConflictException>(() => service.PriceLeg(under.Quote.Code, under.Quote.Legs.First(l => l.Fee == null).Code, 120));
    await Approve(under.Purchase);
    await service.PriceLeg(under.Quote.Code, under.Quote.Legs.Single(l => l.IsDeferred && l.Kind == "InterHub").Code, 120);
    Check(wallet.HeldAmount == 200 && (await service.Get(under.Quote.Code)).DeferredFeePaid == null, "Partial pricing settled early");
    await service.PriceLeg(under.Quote.Code, under.Quote.Legs.Single(l => l.Kind == "Local").Code, 30);
    var settled = await service.Get(under.Quote.Code);
    Check(settled.DeferredFeePaid == 150 && settled.Fee == 230 && wallet.HeldAmount == 0 &&
        wallet.Balance == initialBalance - under.Purchase.PayableAmount - 150, "Within-cap settlement or release is wrong");
    Check(await db.SellerReceivables.SumAsync(i => i.GrossAmount) - incomeBefore == under.Purchase.Orders.Sum(o => o.Subtotal),
        "Deferred shipping leaked into farmer income");
    actor.Id = buyer.UserId; await service.AcceptDeferredFee(under.Quote.Code, 150);
    await service.AcceptDeferredFee(under.Quote.Code, 150);
    Check(wallet.HeldAmount == 0 && wallet.Balance == initialBalance - under.Purchase.PayableAmount - 150, "Repeated acceptance charged twice");
    actor.Id = agent.UserId;
    await Expect<ConflictException>(() => service.PriceLeg(under.Quote.Code, under.Quote.Legs.Single(l => l.Kind == "Local").Code, 40));
    Check(await db.WalletTransactions.CountAsync(t => t.ReferenceId == "DELIVERY_RELEASE_" + under.Quote.Code && t.Amount == 50) == 1,
        "Unused shipping cap must be released once in ledger");
    var over = await Deferred("deferred-over-001", 100); await Approve(over.Purchase);
    var beforeFinal = wallet.Balance;
    await service.PriceLeg(over.Quote.Code, over.Quote.Legs.Single(l => l.IsDeferred && l.Kind == "InterHub").Code, 120);
    await service.PriceLeg(over.Quote.Code, over.Quote.Legs.Single(l => l.Kind == "Local").Code, 30);
    Check(wallet.Balance == beforeFinal && wallet.HeldAmount == 100 && (await service.Get(over.Quote.Code)).ProposedDeferredFee == 150,
        "Above-cap shipping was debited without buyer approval");
    await Expect<NotFoundException>(() => service.AcceptDeferredFee(over.Quote.Code, 150));
    actor.Id = buyer.UserId;
    await Expect<ConflictException>(() => service.AcceptDeferredFee(over.Quote.Code, 149));
    wallet.HeldAmount = wallet.Balance; await db.SaveChangesAsync();
    await Expect<BadRequestException>(() => service.AcceptDeferredFee(over.Quote.Code, 150));
    wallet.HeldAmount = 100; await db.SaveChangesAsync();
    await service.AcceptDeferredFee(over.Quote.Code, 150); await service.AcceptDeferredFee(over.Quote.Code, 150);
    Check(wallet.Balance == beforeFinal - 150 && wallet.HeldAmount == 0, "Approved extra was not charged exactly once");
    var free = await Deferred("deferred-free-001", 200); await Approve(free.Purchase);
    var beforeFree = wallet.Balance;
    await service.PriceLeg(free.Quote.Code, free.Quote.Legs.Single(l => l.IsDeferred && l.Kind == "InterHub").Code, 0);
    await service.PriceLeg(free.Quote.Code, free.Quote.Legs.Single(l => l.Kind == "Local").Code, 0);
    Check(wallet.Balance == beforeFree && wallet.HeldAmount == 0 && (await service.Get(free.Quote.Code)).DeferredFeePaid == 0,
        "A zero final fee must release the entire shipping cap without a debit");
    Check(!await db.WalletTransactions.AnyAsync(t => t.ReferenceId == "DELIVERY_PAY_" + free.Quote.Code), "Zero shipping created a withdrawal");
    var rejected = await Deferred("deferred-reject-001", 200);
    var balanceBeforeReject = wallet.Balance; actor.Id = agent.UserId;
    foreach (var order in rejected.Purchase.Orders) await orderService.ExecuteActionAsync(order.Code,
        new() { Action = AgriculturalOrderAction.Reject, Reason = "ناموجود" });
    Check(wallet.HeldAmount == 0 && wallet.Balance == balanceBeforeReject && (await service.Get(rejected.Quote.Code)).HeldDeliveryFee == 0,
        "Rejecting all farms trapped shipping funds");
    var expired = await Deferred("deferred-expire-001", 200);
    foreach (var order in await db.AgriculturalOrders.Where(o => o.Checkout!.Code == expired.Purchase.Code).ToListAsync())
        order.ApprovalExpiresAt = DateTimeOffset.UtcNow.AddMinutes(-1);
    await db.SaveChangesAsync(); await orderService.ExpireApprovalDueAsync();
    Check(wallet.HeldAmount == 0 && (await service.Get(expired.Quote.Code)).HeldDeliveryFee == 0, "Approval expiry trapped shipping funds");
    Console.WriteLine("PASS: separate shipping cap consent, SQL reads, combined holds, insufficient funds, actual approvals, partial/within/above-cap settlement, buyer-only approval, idempotency, rejection and expiry release.");

    actor.Id = buyer.UserId;
    var grain = new Category { Name = "grain" };
    var wheat = new Category { Name = "wheat", ParentCategory = grain };
    var grade1 = new Category { Name = "grade 1", ParentCategory = wheat };
    var grade2 = new Category { Name = "grade 2", ParentCategory = wheat };
    var unpricedCategory = new Category { Name = "unpricedCategory" };
    db.AddRange(grain, wheat, grade1, grade2, unpricedCategory);
    products[0].Categories = [grain, wheat, grade1]; products[1].Categories = [grade1]; products[2].Categories = [grain];
    var sameGrade = new AgriculturalProduct { Name = "another grade 1", Farm = farms[0], Status = productStatus, SaleUnit = "Kilogram", RetailPrice = 100, Stock = 1000, Categories = [grade1] };
    var otherGrade = new AgriculturalProduct { Name = "grade 2", Farm = farms[0], Status = productStatus, SaleUnit = "Kilogram", RetailPrice = 100, Stock = 1000, Categories = [grade2] };
    db.AddRange(sameGrade, otherGrade); products = [..products, sameGrade, otherGrade];
    ab.PricingMode = "CategoryUnits"; ab.Fee = null; ab.MaxQuantity = null;
    cb.PricingMode = "CategoryUnits"; cb.Fee = null; cb.MaxQuantity = null;
    b.DirectFee = 30;
    await db.SaveChangesAsync();
    await service.SaveCategoryTariff(ab.Code, new(grain.Code, "Kilogram", 50, 100000));
    foreach (var (quantity, expected) in new[] { (1, 100000), (50, 100000), (60, 200000), (100, 200000), (101, 300000) })
        Check((await Quote(await CartFor((0, quantity)), b, "Pickup")).Fee == expected, "50 kg tariff boundary failed: " + quantity);
    await service.SaveCategoryTariff(ab.Code, new(wheat.Code, "Kilogram", 50, 70000));
    Check((await Quote(await CartFor((0, 60)), b, "Pickup")).Fee == 140000, "Nearest parent tariff was not used");
    await service.SaveCategoryTariff(ab.Code, new(grade1.Code, "Kilogram", 50, 90000));
    var historicalTariff = await Quote(await CartFor((0, 60)), b, "Pickup");
    Check(historicalTariff.Fee == 180000 && historicalTariff.Legs.Single().PricingDetails.Single().CategoryCode == grade1.Code,
        "Deepest category did not replace its ancestors");
    Check((await Quote(await CartFor((0, 20), (4, 20)), b, "Pickup")).Fee == 90000, "Same tariff products were rounded separately");
    await service.SaveCategoryTariff(ab.Code, new(grade2.Code, "Kilogram", 50, 50000));
    Check((await Quote(await CartFor((0, 60), (5, 60)), b, "Pickup")).Fee == 280000, "Different grade tariffs were merged");
    await service.SaveCategoryTariff(ab.Code, new(grade1.Code, "Package", 20, 30000));
    var mixedUnits = await Quote(await CartFor((0, 60), (1, 21)), b, "Pickup");
    Check(mixedUnits.Fee == 240000 && mixedUnits.Legs.Single().PricingDetails.Count == 2, "Kilograms and packages were combined");
    await service.SaveCategoryTariff(cb.Code, new(grain.Code, "Piece", 3, 700));
    Check((await Quote(await CartFor((2, 4)), b, "Pickup")).Fee == 1400, "Piece block size failed");
    var autoTariffCart = await CartFor((0, 60));
    Check((await service.Quote(new(autoTariffCart.CartId, addressB.Code, null, "Direct", "با هماهنگی"))).Fee == 180030,
        "Automatic delivery did not use category tariffs plus one local fee");
    sameGrade.Categories = [unpricedCategory]; await db.SaveChangesAsync();
    Check((await Quote(await CartFor((4, 5)), b, "Pickup")).Fee == null, "Missing tariff was treated as freeRoute/flat delivery");
    await service.SaveRoute(ab.Code, new(a.Code, b.Code, 25000, ab.TransitDays, PricingMode: "CategoryUnits"));
    otherGrade.Categories = [unpricedCategory]; await db.SaveChangesAsync();
    var baseCart = await CartFor((0, 60), (4, 5), (5, 7));
    var baseQuote = await Quote(baseCart, b, "Pickup");
    Check(baseQuote.Fee == 205000 && baseQuote.Legs.Single().PricingDetails.Count == 2 &&
        baseQuote.Legs.Single().PricingDetails.Single(d => d.Key.StartsWith("base:")).Fee == 25000,
        "Mixed shipment should add the base fee once to the matched category rate");
    Check((await Quote(await CartFor((4, 5)), b, "Pickup")).Fee == 25000, "Base-only shipment did not use route fee");
    Check((await Quote(await CartFor((0, 60)), b, "Pickup")).Fee == 180000, "Base fee was added to an entirely priced shipment");
    otherGrade.Categories = [grade2];
    sameGrade.Categories = [grade1, grade2]; await db.SaveChangesAsync();
    Check((await Quote(await CartFor((4, 5)), b, "Pickup")).Fee == null, "Conflicting sibling tariffs chose an arbitrary price");
    await service.SaveCategoryTariff(ab.Code, new(grade2.Code, "Kilogram", 50, 90000));
    Check((await Quote(await CartFor((4, 5)), b, "Pickup")).Fee == 90000, "Equivalent sibling tariffs should charge only once");
    await service.RemoveCategoryTariff(ab.Code, grade1.Code, "Kilogram");
    Check((await Quote(await CartFor((0, 60)), b, "Pickup")).Fee == 140000, "Removed child tariff did not fall back to parent");
    await service.SaveCategoryTariff(ab.Code, new(grade1.Code, "Kilogram", 50, 90000));
    Check(await db.DeliveryCategoryTariffs.CountAsync(t => t.DeliveryRouteId == ab.DeliveryRouteId && t.CategoryId == grade1.CategoryId && t.SaleUnit == "Kilogram") == 1,
        "Restoring a removed tariff duplicated the category/unit key");
    await Expect<BadRequestException>(() => service.SaveCategoryTariff(ab.Code, new(grain.Code, "Kilogram", 0, 100)));
    await Expect<BadRequestException>(() => service.SaveCategoryTariff(ab.Code, new(grain.Code, "Ton", 50, 100)));
    await Expect<BadRequestException>(() => service.SaveCategoryTariff(ab.Code, new(grain.Code, "Kilogram", 50, -1)));
    await service.SaveRoute(ab.Code, new(a.Code, b.Code, null, ab.TransitDays, PricingMode: "CategoryUnits", IsBidirectional: true));
    await Expect<ConflictException>(() => service.SaveRoute(null, new(b.Code, a.Code, 100)));
    products[3].Categories = [grain]; await db.SaveChangesAsync();
    var reverseCart = await CartFor((3, 60));
    var reverseDestinations = JsonSerializer.SerializeToElement(await service.Destinations(reverseCart.CartId));
    Check(reverseDestinations.EnumerateArray().Any(p => p.GetProperty("Code").GetString() == a.Code), "Reverse destination missing");
    var reverseQuote = await Quote(reverseCart, a, "Pickup", addressA);
    Check(reverseQuote.Fee == 200000 && reverseQuote.Legs.Single().PricingDetails.Single().BlockCount == 2,
        "Reverse route did not reuse category tariff");
    Check((await service.Quote(new(reverseCart.CartId, addressA.Code, null, "Direct", "با هماهنگی"))).Fee == 200020,
        "Automatic destination did not find reverse route");
    Check((await catalog.GetByFilterAsync(new() { DestinationPointCode = a.Code }, "Manager")).Items.Any(p => p.Code == products[3].Code),
        "Product filter missed reverse route");
    var reverseBuy = Buy(reverseCart, reverseQuote, "reverse-category-001"); reverseBuy.AddressCode = addressA.Code;
    Check((await checkout.CreateFromCartAsync(reverseBuy)).Orders.Count == 1, "Reverse category quote did not pass checkout");
    await service.SaveRoute(ab.Code, new(a.Code, b.Code, 25000, ab.TransitDays, PricingMode: "CategoryUnits", IsBidirectional: false));
    Console.WriteLine("PASS: one shared route and category tariff serve both directions through destinations, quote, catalog and checkout.");

    var ac = new DeliveryRoute { OriginPoint = a, DestinationPoint = c, PricingMode = "CategoryUnits" };
    var inactive = new DeliveryRoute { OriginPoint = b, DestinationPoint = c, Fee = 12345, IsActive = false };
    var freeRoute = new DeliveryRoute { OriginPoint = b, DestinationPoint = a, Fee = 0 };
    var manual = new DeliveryRoute { OriginPoint = c, DestinationPoint = a, Fee = null };
    db.AddRange(ac, inactive, freeRoute, manual); await db.SaveChangesAsync();
    await service.SaveCategoryTariff(ac.Code, new(grain.Code, "Kilogram", 50, 200000));
    Check((await Quote(await CartFor((0, 60)), c, "Pickup")).Fee == 400000, "Route-specific category tariff was reused from another route");
    var preview = JsonSerializer.SerializeToElement(await service.IncreaseTariffs(new(10), false));
    Check(preview.GetProperty("CategoryCount").GetInt32() == 7 && preview.GetProperty("BaseCount").GetInt32() == 1 &&
        inactive.Fee == 12345 && ab.Fee == 25000, "Bulk preview changed prices or missed tariffs");
    await service.SaveCategoryTariff(ab.Code, new(grade1.Code, "Kilogram", 50, 95000));
    await Expect<ConflictException>(() => service.IncreaseTariffs(new(10, preview.GetProperty("Token").GetString()), true));
    Check(inactive.Fee == 12345, "Stale bulk preview partially updated prices");
    preview = JsonSerializer.SerializeToElement(await service.IncreaseTariffs(new(10), false));
    var token = preview.GetProperty("Token").GetString();
    var retailBeforeIncrease = products[0].RetailPrice;
    await service.IncreaseTariffs(new(10, token), true);
    Check((await Quote(await CartFor((0, 60)), b, "Pickup")).Fee == 209000 && ab.Fee == 27500 && inactive.Fee == 13580 && freeRoute.Fee == 0 && manual.Fee == null,
        "Bulk increase failed category prices, whole-toman ceiling, inactive route, zero or missing price");
    Check(products[0].RetailPrice == retailBeforeIncrease && b.DirectFee == 30 &&
        (await service.Get(historicalTariff.Code)).Fee == 180000 &&
        (await service.Get(historicalTariff.Code)).Legs.Single().PricingDetails.Single().PricePerBlock == 90000,
        "Bulk increase changed goods, local fees or historical pricing snapshots");
    await Expect<ConflictException>(() => service.IncreaseTariffs(new(10, token), true));
    await Expect<BadRequestException>(() => service.IncreaseTariffs(new(0), false));
    await Expect<BadRequestException>(() => service.IncreaseTariffs(new(-1), false));
    await Expect<ConflictException>(() => service.IncreaseTariffs(new(10), true));
    await Expect<PostgresException>(() => db.Database.ExecuteSqlRawAsync("UPDATE \"DeliveryCategoryTariffs\" SET \"BlockSize\"=0"));
    Console.WriteLine("PASS: category hierarchy/parent fallback, deepest overrides, ambiguous/equivalent siblings, mixed units, ceiling boundaries, category aggregation, independent routes, automatic delivery, tariff restore, preview/stale/replay protection, percentage increase and immutable historical prices.");

    var settlement = new SettlementService(R<SellerReceivable>(), R<SettlementRequest>(), R<SettlementCalendarDay>(), R<SettlementRates>(), actor, unit);
    actor.Id = agent.UserId; actor.AssignedRoles = ["Farmer"];
    var settlementBefore = await settlement.Summary();
    Check(settlementBefore.Available >= 10 && settlementBefore.NextPaymentDate == null, "Missing calendar settlement fixture invalid");
    var ibanPayload = new string('0', 22); var ibanRemainder = 0;
    foreach (var digit in ibanPayload + "182700") ibanRemainder = (ibanRemainder * 10 + digit - '0') % 97;
    var testIban = "IR" + (98 - ibanRemainder).ToString("D2") + ibanPayload;
    var requestInput = new SettlementCreateDto(10, testIban, "test seller", "settlement-no-calendar-001");
    var requestBeforeCalendar = await settlement.Create(requestInput);
    Check(requestBeforeCalendar.ScheduledDate == null && (await settlement.Summary()).Available == settlementBefore.Available - 10, "Unscheduled settlement did not reserve available seller income");
    Check((await settlement.Create(requestInput)).Code == requestBeforeCalendar.Code && await db.SettlementRequests.CountAsync() == 1, "Settlement retry reserved income twice");
    actor.Id = buyer.UserId; actor.AssignedRoles = ["User"];
    await Expect<ForbiddenException>(() => settlement.Act(requestBeforeCalendar.Code, new("Cancel", null, null)));
    actor.AssignedRoles = ["Manager"];
    Check((await settlement.Act(requestBeforeCalendar.Code, new("Cancel", "cancelled by manager", null))).Status == "Cancelled", "Manager could not cancel another seller's pending request");
    actor.Id = agent.UserId;
    var queued = await settlement.Create(requestInput with { IdempotencyKey = "settlement-no-calendar-002" });
    actor.Id = buyer.UserId;
    await settlement.Act(queued.Code, new("Approve", "account ownership reviewed", null));
    await Expect<ConflictException>(() => settlement.Act(queued.Code, new("StartTransfer", null, null)));
    var cycleSaturday = SettlementPolicy.Cycle(DateTimeOffset.UtcNow).Saturday;
    await settlement.SaveCalendar(new(cycleSaturday, cycleSaturday.AddDays(30), []));
    var scheduledRequest = (await settlement.List(true, null)).Items.Single(r => r.Code == queued.Code);
    Check(scheduledRequest.ScheduledDate == cycleSaturday, "Confirmed calendar did not schedule queued request");
    var managedOrder = savedCheckout.Orders.First();
    var previousState = managedOrder.Status; var previousHeld = managedOrder.IsHeld;
    managedOrder.Status = checking; managedOrder.IsHeld = true; managedOrder.ApprovalExpiresAt = DateTimeOffset.UtcNow.AddHours(1);
    Check(AgriculturalOrderPolicy.AllowedActions(managedOrder, buyer.UserId, true).Contains("Approve") &&
        !AgriculturalOrderPolicy.AllowedActions(managedOrder, buyer.UserId, false).Contains("Approve"), "Manager/owner order action permissions are incorrect");
    managedOrder.Status = previousState; managedOrder.IsHeld = previousHeld;
    Console.WriteLine("PASS: manager delivery override, assigned-agent and buyer boundaries, settlement creation without calendar, income reservation/idempotency, manager cancellation, ordinary-user isolation and later scheduling.");

    await Expect<PostgresException>(() => db.GetService<IMigrator>().MigrateAsync("20261105173132_InterHubDelivery"));
    Check((await db.Database.GetAppliedMigrationsAsync()).Any(m => m.EndsWith("CategoryRouteTariffs")), "Downgrade removed category tariffs or price snapshots");
    Check((await db.Database.GetAppliedMigrationsAsync()).Any(m => m.EndsWith("DeferredDeliveryWallet")), "Downgrade removed shipping financial records");

    await Expect<PostgresException>(() => db.Database.ExecuteSqlRawAsync("UPDATE \"DeliveryRoutes\" SET \"DestinationPointId\"=\"OriginPointId\""));
    await Expect<PostgresException>(() => db.GetService<IMigrator>().MigrateAsync("20261105161947_RelationalIntegrityCleanup"));
    Console.WriteLine("PASS: route constraints and downgrade data preservation.");
}
finally
{
    NpgsqlConnection.ClearAllPools();
    Check(name.StartsWith("interhub_test_") && name.Length == 46, "Unexpected cleanup database");
    await admin.ExecuteAsync($"DROP DATABASE \"{name}\" WITH (FORCE)");
    Console.WriteLine("Temporary routing database removed.");
}

static void Check(bool value, string message) { if (!value) throw new InvalidOperationException(message); }
static async Task Expect<T>(Func<Task> action) where T : Exception
{
    try { await action(); } catch (T) { return; }
    throw new InvalidOperationException("Expected " + typeof(T).Name);
}
sealed class Connections(string connection) : IDbConnectionFactory { public IDbConnection CreateConnection() => new NpgsqlConnection(connection); }
sealed class Notices : INotificationWriter { public Task<Notification?> AddForUserAsync(int id, string type, string message) => Task.FromResult<Notification?>(null); }
sealed class Actor(int id) : ICurrentUserService
{
    public string[] AssignedRoles { get; set; } = ["Manager"];
    public int Id { get; set; } = id;
    public string? UserId => Id.ToString(); public string? UserName => "test"; public string? UserCode => null;
    public IEnumerable<string> Roles => AssignedRoles; public bool IsAuthenticated => true; public bool IsGuest => false;
    public string? CartId => null; public string? GuestCartId => null; public void ClearGuestCartId() { }
}
