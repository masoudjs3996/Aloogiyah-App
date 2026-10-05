using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using Microsoft.EntityFrameworkCore;


namespace AlooGiyah_Persistence.Context;

public class AlooGiyahDbContext : DbContext
{
    public DbSet<Files> Files { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Checkout> Checkouts { get; set; }
    public DbSet<CheckoutPayment> CheckoutPayments { get; set; }
    public DbSet<OrderRefund> OrderRefunds { get; set; }
    public DbSet<AgriculturalOrderHistory> AgriculturalOrderHistories { get; set; }
    public DbSet<AgriculturalOrder> AgriculturalOrders { get; set; }
    public DbSet<AgriculturalOrderItem> AgriculturalOrderItems { get; set; }
    public DbSet<AgriculturalProduct> AgriculturalProducts { get; set; }
    public DbSet<Cart> Carts{ get; set; }
    public DbSet<CartItem> CartItems { get; set; }
    public DbSet<Article> Articles { get; set; }
    public DbSet<Auction> Auctions { get; set; }
    public DbSet<AuctionBid> AuctionBids { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<FileType> FileTypes { get; set; }
    public DbSet<Farm> Farms { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<QualityAssessment> QualityAssessments { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<ServiceRequest> ServiceRequests { get; set; }
    public DbSet<Status> Statuses { get; set; }
    public DbSet<StatusChangeLog> StatusChangeLogs { get; set; }
    public DbSet<RefreshToken> RefreshToken { get; set; }
    public DbSet<Discount> Discounts { get; set; }
    public DbSet<Address> Addresses { get; set; }
    public DbSet<Province> Provinces { get; set; }
    public DbSet<County> Countys { get; set; }
    public DbSet<City> Citys { get; set; }
    public DbSet<Village> Villages { get; set; }
    public DbSet<Wallet> Wallets { get; set; }
    public DbSet<WalletTransaction> WalletTransactions { get; set; }
    public DbSet<Warehouse> Warehouses { get; set; }
    public DbSet<WarehouseInventory> WarehouseInventories { get; set; }
    public DbSet<Slider> Sliders { get; set; }

    public AlooGiyahDbContext(DbContextOptions<AlooGiyahDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AlooGiyahDbContext).Assembly);

        // ⭐ index روی Code + IsDeleted برای همه BaseEntity ها
        var entityTypes = modelBuilder.Model.GetEntityTypes()
            .Where(e => typeof(BaseEntity).IsAssignableFrom(e.ClrType));

        foreach (var entityType in entityTypes)
        {
            modelBuilder.Entity(entityType.ClrType)
                .HasIndex(new[] { nameof(BaseEntity.Code), nameof(BaseEntity.IsDeleted) })
                .IsUnique(); 
        }
    }

}