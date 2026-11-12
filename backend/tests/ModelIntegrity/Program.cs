using System.Data;
using AlooGiyah_Application.DTOs.Discount;
using AlooGiyah_Application.DTOs.WarehouseInventory;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Application.Services;
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
using AutoMapper;
using Dapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Npgsql;

const string previous = "20261103204421_ChatPushRegistrations";
const string cleanup = "20261105161947_RelationalIntegrityCleanup";
using var metadata = new AlooGiyahDbContext(new DbContextOptionsBuilder<AlooGiyahDbContext>()
    .UseNpgsql("Host=localhost;Database=metadata_only;Username=unused;Password=unused").Options);
var exceptions = new HashSet<string>
{
    "Cart.GuestId", "Checkout.CartId", "DeliveryBooking.CartId",
    "StatusChangeLog.EntityId", "WarehouseInventory.EntityId", "WalletTransaction.ReferenceId"
};
foreach (var entity in metadata.Model.GetEntityTypes().Where(e => !e.HasSharedClrType))
{
    foreach (var p in entity.GetProperties())
    {
        Check(!p.IsShadowProperty(), $"Unexpected shadow column: {entity.ClrType.Name}.{p.Name}");
        if (p.Name.EndsWith("Id") && !p.IsPrimaryKey() && !p.IsForeignKey())
            Check(exceptions.Contains($"{entity.ClrType.Name}.{p.Name}"), $"Unbound identifier: {entity.ClrType.Name}.{p.Name}");
    }
}
Check(!metadata.Model.FindEntityType(typeof(AgriculturalProduct))!.GetProperties().Any(p => p.Name == "UserId"), "Redundant product owner returned");
Check(!metadata.Model.FindEntityType(typeof(Cart))!.GetIndexes().Any(i => i.Properties.Count == 1 && i.Properties[0].Name == "CartId"), "Duplicate cart primary-key index returned");
Check(!metadata.Model.FindEntityType(typeof(DeliveryPoint))!.GetIndexes().Any(i => i.Properties.Count == 1 && i.Properties[0].Name == "Code"), "Duplicate delivery-point key index returned");
Check(!metadata.Database.HasPendingModelChanges(), "Migration snapshot does not match the model");
Console.WriteLine("PASS: model relationships, no shadow columns, no duplicate key indexes, migration snapshot.");
if (!args.Contains("--database")) return;

// Only create and drop our own randomly named database, on a local PostgreSQL server.
using var configured = new AlooGiyahDesignTimeFactory().CreateDbContext([]);
var adminSettings = new NpgsqlConnectionStringBuilder(
    Environment.GetEnvironmentVariable("MODEL_INTEGRITY_ADMIN_CONNECTION") ?? configured.Database.GetConnectionString());
Check(adminSettings.Host is "localhost" or "127.0.0.1" or "::1", "Database tests require local PostgreSQL");
adminSettings.Database = "postgres";
var databaseName = "model_integrity_" + Guid.NewGuid().ToString("N");
await using var admin = new NpgsqlConnection(adminSettings.ConnectionString);
await admin.OpenAsync();
await admin.ExecuteAsync($"CREATE DATABASE \"{databaseName}\"");
try
{
    var settings = new NpgsqlConnectionStringBuilder(adminSettings.ConnectionString) { Database = databaseName };
    // Exercise the historical cleanup schema with its matching runtime model, even as newer migrations are added.
    await using var db = new AlooGiyahDbContext(new DbContextOptionsBuilder<AlooGiyahDbContext>().UseNpgsql(settings.ConnectionString)
        .UseModel(SchemaModels.BeforeInterHub(metadata)).ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)).Options);
    var migrator = db.GetService<IMigrator>();
    await migrator.MigrateAsync(previous);
    var role = new Role { Name = "Manager" };
    var user = new User { UserName = "model-test", Role = role, Password = "test-only" };
    var status = new Status { Name = "test", EntityStatus = EntityStatus.FarmStatus };
    var point = new DeliveryPoint { Name = "test point" };
    var farm = new Farm { Name = "test farm", Owner = user, Status = status, DeliveryPointCode = point.Code };
    var product = new AgriculturalProduct { Name = "test plant", Farm = farm, Status = status, RetailPrice = 1000, WholesalePrice = 900, Stock = 10 };
    var category = new Category { Name = "test category" };
    var discount = new Discount { Value = 10, DiscountType = DiscountType.Percentage, IsActive = true, FundingSource = "Platform" };
    var warehouse = new Warehouse { Name = "test warehouse", Farmer = user };
    product.Categories = [category];
    db.AddRange(user, status, point, farm, product, category, discount, warehouse);
    await db.SaveChangesAsync();
    await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE \"Categories\" SET \"DiscountId\"={discount.DiscountId} WHERE \"CategoryId\"={category.CategoryId}");
    var inventory = new WarehouseInventory { Warehouse = warehouse, EntityId = product.AgriculturalProductId, EntityWarehouse = EntityWarehouseInventory.AgriculturalProduct, Quantity = 5 };
    var booking = new DeliveryBooking { BuyerId = user.UserId, Point = point, CartId = Guid.NewGuid(), QuoteExpiresAt = DateTimeOffset.UtcNow.AddDays(1) };
    db.AddRange(inventory, booking);
    await db.SaveChangesAsync();
    var province = new Province { Name = "test province", Status = status };
    var county = new County { Name = "test county", Province = province, Status = status };
    var address = new Address { User = user, Province = province, County = county };
    var order = new AgriculturalOrder { Buyer = user, Farm = farm, Status = status, Address = address,
        FarmNameSnapshot = "original farm", AddressSnapshotJson = "{\"street\":\"original\"}", TotalPrice = 5000, HeldAmount = 5000, IsHeld = true,
        AgriculturalOrderItems = [new() { AgriculturalProduct = product, Quantity = 5, Price = 1000, ProductNameSnapshot = "original plant" }] };
    var income = new SellerReceivable { Order = order, SellerId = user.UserId, GrossAmount = 5000, NetAmount = 4500, ReleasedAmount = 0 };
    db.AddRange(order, income);
    await db.SaveChangesAsync();

    // An orphan reference must abort the entire upgrade and leave the old schema usable.
    await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE \"DeliveryBookings\" SET \"QuotedById\"={int.MaxValue} WHERE \"DeliveryBookingId\"={booking.DeliveryBookingId}");
    await ExpectDatabaseError(() => migrator.MigrateAsync(cleanup), "P0001");
    Check(!(await db.Database.GetAppliedMigrationsAsync()).Any(m => m.EndsWith("RelationalIntegrityCleanup")), "Failed upgrade was partially applied");
    await db.Database.ExecuteSqlRawAsync("UPDATE \"DeliveryBookings\" SET \"QuotedById\"=NULL");
    await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE \"AgriculturalProducts\" SET \"UserId\"={user.UserId}");
    await ExpectDatabaseError(() => migrator.MigrateAsync(cleanup), "P0001");
    await db.Database.ExecuteSqlRawAsync("UPDATE \"AgriculturalProducts\" SET \"UserId\"=NULL");
    // Even a soft-deleted orphan must be reported rather than silently deleted.
    await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE \"Farms\" SET \"DeliveryPointCode\"={"MISSING123"}, \"IsDeleted\"=TRUE WHERE \"FarmId\"={farm.FarmId}");
    await ExpectDatabaseError(() => migrator.MigrateAsync(cleanup), "P0001");
    await db.Database.ExecuteSqlInterpolatedAsync($"UPDATE \"Farms\" SET \"DeliveryPointCode\"={point.Code}, \"IsDeleted\"=FALSE WHERE \"FarmId\"={farm.FarmId}");
    await migrator.MigrateAsync(cleanup);
    db.ChangeTracker.Clear();
    Check((await db.WarehouseInventories.SingleAsync()).AgriculturalProductId == product.AgriculturalProductId, "Inventory target was not backfilled");
    Check(await db.Categories.Where(c => c.CategoryId == category.CategoryId).SelectMany(c => c.Discounts).CountAsync() == 1, "Old discount association was lost");
    Check(await db.Farms.Where(f => f.DeliveryPoint!.Code == point.Code).CountAsync() == 1, "Farm-to-point relation does not load");
    var savedIncome = await db.SellerReceivables.SingleAsync();
    var savedOrder = await db.AgriculturalOrders.Include(o => o.AgriculturalOrderItems).SingleAsync();
    Check(savedIncome.NetAmount == 4500 && savedIncome.ReleasedAmount == 0 && savedOrder.HeldAmount == 5000 && savedOrder.IsHeld, "Migration changed financial state");
    Check(savedOrder.FarmNameSnapshot == "original farm" && savedOrder.AgriculturalOrderItems[0].ProductNameSnapshot == "original plant", "Historical snapshot changed");
    Console.WriteLine("PASS: legacy upgrade, orphan guards, inventory backfill, preserved discounts, financial state and historical snapshots.");

    var secondDiscount = new Discount { Value = 20, DiscountType = DiscountType.Percentage, IsActive = true };
    secondDiscount.Categories = [await db.Categories.SingleAsync()];
    db.Add(secondDiscount);
    await db.SaveChangesAsync();
    db.ChangeTracker.Clear();
    Check(await db.Discounts.Where(d => d.Categories.Any(c => c.CategoryId == category.CategoryId)).CountAsync() == 2, "Discounts stole each other's category");
    var mapper = new MapperConfiguration(c => c.AddProfile<AlooGiyah_Application.Mappings.Profile>(), NullLoggerFactory.Instance).CreateMapper();
    var viewer = new TestUser(user.UserId);
    var factory = new TestConnectionFactory(settings.ConnectionString);
    var query = new DiscountQuery(factory, mapper, viewer);
    Check((await query.GetByCodeAsync(discount.Code))!.CategoryCodes!.Contains(category.Code), "Discount SQL detail query lost categories");
    Check((await query.GetByFilterAsync(new DiscountFilterDto { CategoryCodes = category.Code })).TotalCount == 2, "Discount SQL category filter failed");
    var cart = new Cart { UserId = user.UserId, DiscountId = discount.DiscountId,
        CartItems = [new() { AgriculturalProductId = product.AgriculturalProductId, Quantity = 2, Price = 1000 }] };
    db.Add(cart); await db.SaveChangesAsync();
    var config = new ConfigurationBuilder().Build();
    var pricing = new PriceCalculatorService(new GenericRepository<AgriculturalProduct>(db), config);
    var cartQuery = new CartQuery(factory, viewer, pricing, config);
    Check(await cartQuery.GetCartByIdAsync(cart.CartId) != null, "Cart SQL query failed after discount normalization");
    // Exercise the existing inventory service, not just direct entity writes.
    var secondWarehouse = new Warehouse { Name = "second", FarmerId = user.UserId };
    db.Add(secondWarehouse); await db.SaveChangesAsync();
    var service = new WarehouseInventoryService(new WarehouseInventoryQuery(factory, viewer),
        new GenericRepository<WarehouseInventory>(db), new GenericRepository<Warehouse>(db),
        new GenericRepository<AgriculturalProduct>(db), new UnitOfWork(db), mapper);
    await service.CreateAsync(new WarehouseInventoryCreateDto { WarehouseCode = secondWarehouse.Code, EntityCode = product.Code, EntityWarehouse = EntityWarehouseInventory.AgriculturalProduct, Quantity = 2 });
    Console.WriteLine("PASS: shared category discounts, discount list/detail filters, cart query, inventory service.");

    await ExpectSqlError(db, "UPDATE \"DeliveryBookings\" SET \"QuotedById\"=2147483647", "23503");
    await ExpectSqlError(db, "UPDATE \"Farms\" SET \"DeliveryPointCode\"='MISSING123'", "23503");
    await ExpectSqlError(db, "UPDATE \"WarehouseInventories\" SET \"AgriculturalProductId\"=NULL", "23514");
    await ExpectSqlError(db, "UPDATE \"WarehouseInventories\" SET \"Quantity\"=-1", "23514");
    await ExpectSqlError(db, "UPDATE \"DeliveryPoints\" SET \"DirectFee\"=-1", "23514");
    var comment = new Comment { UserId = user.UserId, StatusId = status.StatusId, EntityCode = product.Code,
        EntityComment = EntityComment.AgriculturalProduct, Content = "test review", Rating = 5 };
    var batch = new DeliveryBatch { DeliveryBookingId = booking.DeliveryBookingId, AgentId = user.UserId,
        ExpectedAt = DateTimeOffset.UtcNow, Items = [new() { AgriculturalOrderItemId = savedOrder.AgriculturalOrderItems[0].AgriculturalOrderItemId, Quantity = 1 }] };
    db.AddRange(comment, batch); await db.SaveChangesAsync();
    await ExpectSqlError(db, "UPDATE \"Comments\" SET \"Rating\"=0", "23514");
    await ExpectSqlError(db, "UPDATE \"DeliveryBatchItems\" SET \"Quantity\"=0", "23514");
    await ExpectSqlError(db, $"DELETE FROM \"DeliveryPoints\" WHERE \"DeliveryPointId\"={point.DeliveryPointId}", "23503");
    var regularProduct = new Product { Name = "regular", RetailPrice = 100, WholesalePrice = 90 };
    db.Add(regularProduct); await db.SaveChangesAsync();
    var regularInventory = new WarehouseInventory { WarehouseId = warehouse.WarehouseId, EntityId = regularProduct.ProductId, ProductId = regularProduct.ProductId, EntityWarehouse = EntityWarehouseInventory.Product, Quantity = 1 };
    db.Add(regularInventory); await db.SaveChangesAsync();
    Check(await db.WarehouseInventories.Where(w => w.Product != null && w.Product.Name == "regular").CountAsync() == 1, "Regular product inventory target failed");
    await ExpectSqlError(db, $"UPDATE \"WarehouseInventories\" SET \"ProductId\"=2147483647, \"EntityId\"=2147483647 WHERE \"WarehouseInventoryId\"={regularInventory.WarehouseInventoryId}", "23503");
    await ExpectSqlError(db, $"UPDATE \"WarehouseInventories\" SET \"WarehouseId\"={warehouse.WarehouseId} WHERE \"WarehouseId\"={secondWarehouse.WarehouseId}", "23505");
    // A soft-deleted duplicate remains valid history, while active duplicates are rejected.
    inventory = new WarehouseInventory { WarehouseId = warehouse.WarehouseId, EntityId = product.AgriculturalProductId, AgriculturalProductId = product.AgriculturalProductId, Quantity = 0, IsDeleted = true };
    db.Add(inventory); await db.SaveChangesAsync();
    Console.WriteLine("PASS: foreign keys, protected deletes, warehouse targets, quantity/rating/fee rules and active-only uniqueness.");

    await ExpectDatabaseError(() => migrator.MigrateAsync(previous), "P0001");
    Check((await db.Database.GetAppliedMigrationsAsync()).Any(m => m.EndsWith("RelationalIntegrityCleanup")), "Unsafe rollback was partially applied");
    // Remove only the new extra link, making the old schema representable again.
    await db.Database.ExecuteSqlInterpolatedAsync($"DELETE FROM \"DiscountCategories\" WHERE \"DiscountsDiscountId\"={secondDiscount.DiscountId}");
    await migrator.MigrateAsync(previous);
    await using (var read = new NpgsqlConnection(settings.ConnectionString))
        Check(await read.ExecuteScalarAsync<int>($"SELECT \"DiscountId\" FROM \"Categories\" WHERE \"CategoryId\"={category.CategoryId}") == discount.DiscountId, "Rollback lost original category association");
    await migrator.MigrateAsync(cleanup);
    Check(!metadata.Database.HasPendingModelChanges(), "Final migration snapshot mismatch");
    Console.WriteLine("PASS: unsafe rollback protection, lossless supported rollback, re-upgrade.");
}
finally
{
    NpgsqlConnection.ClearAllPools();
    Check(databaseName.StartsWith("model_integrity_") && databaseName.Length == 48, "Unexpected cleanup target");
    await admin.ExecuteAsync($"DROP DATABASE \"{databaseName}\" WITH (FORCE)");
    Console.WriteLine("Temporary test database removed.");
}

static void Check(bool condition, string message) { if (!condition) throw new InvalidOperationException(message); }
static async Task ExpectSqlError(AlooGiyahDbContext db, string sql, string state) =>
    await ExpectDatabaseError(async () => { await db.Database.ExecuteSqlRawAsync(sql); }, state);
static async Task ExpectDatabaseError(Func<Task> action, string state)
{
    try { await action(); }
    catch (PostgresException e) when (e.SqlState == state) { return; }
    catch (DbUpdateException e) when (e.InnerException is PostgresException p && p.SqlState == state) { return; }
    throw new InvalidOperationException($"Expected PostgreSQL error {state}");
}
sealed class TestConnectionFactory(string connection) : IDbConnectionFactory
{
    public IDbConnection CreateConnection() => new NpgsqlConnection(connection);
}
sealed class TestUser(int id) : ICurrentUserService
{
    public string? UserId => id.ToString();
    public string? UserName => "model-test";
    public string? UserCode => null;
    public IEnumerable<string> Roles => ["Manager"];
    public bool IsAuthenticated => true;
    public string? CartId => null;
    public bool IsGuest => false;
    public string? GuestCartId => null;
    public void ClearGuestCartId() { }
}
