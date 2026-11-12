using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using Microsoft.EntityFrameworkCore;


namespace AlooGiyah_Persistence.Context;

public class AlooGiyahDbContext : DbContext
{
    public DbSet<BusinessTermsAcceptance> BusinessTermsAcceptances { get; set; }
    public DbSet<SellerReceivable> SellerReceivables { get; set; }
    public DbSet<SettlementRates> SettlementRates { get; set; }
    public DbSet<SettlementTransferAttempt> SettlementTransferAttempts { get; set; }
    public DbSet<SettlementRequest> SettlementRequests { get; set; }
    public DbSet<SettlementHistory> SettlementHistories { get; set; }
    public DbSet<SettlementCalendarDay> SettlementCalendarDays { get; set; }
    public DbSet<Files> Files { get; set; }
    public DbSet<EntityCodeRegistry> EntityCodeRegistry { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<PhoneOtpChallenge> PhoneOtpChallenges { get; set; }
    public DbSet<DeliveryPoint> DeliveryPoints { get; set; }
    public DbSet<DeliveryRoute> DeliveryRoutes { get; set; }
    public DbSet<DeliveryCategoryTariff> DeliveryCategoryTariffs { get; set; }
    public DbSet<DeliveryLeg> DeliveryLegs { get; set; }
    public DbSet<DeliveryBooking> DeliveryBookings { get; set; }
    public DbSet<DeliveryBatch> DeliveryBatches { get; set; }
    public DbSet<DeliveryBatchItem> DeliveryBatchItems { get; set; }
    public DbSet<DeliveryEvent> DeliveryEvents { get; set; }
    public DbSet<Checkout> Checkouts { get; set; }
    public DbSet<CheckoutPayment> CheckoutPayments { get; set; }
    public DbSet<OrderRefund> OrderRefunds { get; set; }
    public DbSet<AgriculturalOrderHistory> AgriculturalOrderHistories { get; set; }
    public DbSet<AgriculturalOrder> AgriculturalOrders { get; set; }
    public DbSet<AgriculturalOrderItem> AgriculturalOrderItems { get; set; }
    public DbSet<AgriculturalProduct> AgriculturalProducts { get; set; }
    public DbSet<AgriculturalListing> AgriculturalListings { get; set; }
    public DbSet<SavedListing> SavedListings { get; set; }
    public DbSet<AgriculturalProductTemplate> AgriculturalProductTemplates { get; set; }
    public DbSet<AgriculturalProductTemplateSpecification> AgriculturalProductTemplateSpecifications { get; set; }
    public DbSet<AgriculturalProductTemplateSpecificationOption> AgriculturalProductTemplateSpecificationOptions { get; set; }
    public DbSet<AgriculturalProductSpecificationValue> AgriculturalProductSpecificationValues { get; set; }
    public DbSet<ProductInquiry> ProductInquiries { get; set; }
    public DbSet<ProductReport> ProductReports { get; set; }
    public DbSet<AgriculturalProductOffer> AgriculturalProductOffers { get; set; }
    public DbSet<Cart> Carts{ get; set; }
    public DbSet<CartItem> CartItems { get; set; }
    public DbSet<Article> Articles { get; set; }
    public DbSet<Auction> Auctions { get; set; }
    public DbSet<AuctionBid> AuctionBids { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<ChatConversation> ChatConversations { get; set; }
    public DbSet<ChatConversationBlock> ChatConversationBlocks { get; set; }
    public DbSet<ChatMessageReport> ChatMessageReports { get; set; }
    public DbSet<AccountFileDeletion> AccountFileDeletions { get; set; }
    public DbSet<ChatMessageAttachment> ChatMessageAttachments { get; set; }
    public DbSet<FileType> FileTypes { get; set; }
    public DbSet<Farm> Farms { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<PushRegistration> PushRegistrations { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<SavedProduct> SavedProducts { get; set; }
    public DbSet<QualityAssessmentTariff> QualityAssessmentTariffs { get; set; }
    public DbSet<QualityAssessment> QualityAssessments { get; set; }
    public DbSet<BusinessApplication> BusinessApplications { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
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

        modelBuilder.Entity<ProductReport>(report =>
        {
            report.HasOne<AgriculturalListing>().WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            report.HasOne<User>().WithMany().HasForeignKey(x => x.ReporterId).OnDelete(DeleteBehavior.Restrict);
            report.HasOne<User>().WithMany().HasForeignKey(x => x.ReviewedById).OnDelete(DeleteBehavior.Restrict);
            report.HasIndex(x => new { x.ReporterId, x.ProductId })
                .IsUnique().HasFilter("\"ReviewedAt\" IS NULL");
        });

        modelBuilder.Entity<ChatMessageReport>(report =>
        {
            report.HasOne(x => x.Message).WithMany().HasForeignKey(x => x.MessageId).OnDelete(DeleteBehavior.Restrict);
            report.HasOne<User>().WithMany().HasForeignKey(x => x.ReporterId).OnDelete(DeleteBehavior.Restrict);
            report.HasOne<User>().WithMany().HasForeignKey(x => x.ReviewedById).OnDelete(DeleteBehavior.Restrict);
            report.HasIndex(x => new { x.ReporterId, x.MessageId }).IsUnique().HasFilter("\"ReviewedAt\" IS NULL");
        });
        modelBuilder.Entity<AccountFileDeletion>().HasIndex(x => x.RetryAt);

        modelBuilder.Entity<AgriculturalProductTemplate>(template =>
        {
            template.HasOne(x => x.Category).WithMany()
                .HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            template.HasIndex(x => new { x.CategoryId, x.Name }).IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
        });

        modelBuilder.Entity<AgriculturalProductTemplateSpecification>(specification =>
        {
            specification.HasOne(x => x.Template).WithMany(x => x.Specifications)
                .HasForeignKey(x => x.AgriculturalProductTemplateId).OnDelete(DeleteBehavior.Cascade);
            specification.HasIndex(x => new { x.AgriculturalProductTemplateId, x.Name }).IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
        });

        modelBuilder.Entity<AgriculturalProductTemplateSpecificationOption>(option =>
        {
            option.HasOne(x => x.Specification).WithMany(x => x.Options)
                .HasForeignKey(x => x.AgriculturalProductTemplateSpecificationId).OnDelete(DeleteBehavior.Cascade);
            option.HasIndex(x => new { x.AgriculturalProductTemplateSpecificationId, x.Label }).IsUnique()
                .HasFilter("\"IsDeleted\" = FALSE");
        });

        modelBuilder.Entity<AgriculturalListing>(listing =>
        {
            listing.ToTable("AgriculturalAdvertisement");
            listing.HasOne(x => x.Farm).WithMany().HasForeignKey(x => x.FarmId).OnDelete(DeleteBehavior.Restrict);
            listing.HasOne(x => x.ProductTemplate).WithMany(x => x.Listings)
                .HasForeignKey(x => x.AgriculturalProductTemplateId).OnDelete(DeleteBehavior.Restrict);
            listing.HasIndex(x => x.LegacyProductCode).IsUnique();
            listing.HasMany(x => x.Categories).WithMany().UsingEntity<Dictionary<string, object>>(
                "AgriculturalListingCategory",
                category => category.HasOne<Category>().WithMany().HasForeignKey("CategoryId"),
                entry => entry.HasOne<AgriculturalListing>().WithMany().HasForeignKey("ListingId"),
                join => { join.HasKey("ListingId", "CategoryId"); });
        });

        modelBuilder.Entity<SavedListing>().HasKey(x => new { x.UserId, x.ListingId });

        modelBuilder.Entity<AgriculturalProductSpecificationValue>(value =>
        {
            value.HasKey(x => new { x.AgriculturalListingId, x.AgriculturalProductTemplateSpecificationId });
            value.HasOne(x => x.Listing).WithMany(x => x.SpecificationValues)
                .HasForeignKey(x => x.AgriculturalListingId).OnDelete(DeleteBehavior.Cascade);
            value.HasOne(x => x.Specification).WithMany()
                .HasForeignKey(x => x.AgriculturalProductTemplateSpecificationId).OnDelete(DeleteBehavior.Restrict);
            value.HasOne(x => x.Option).WithMany()
                .HasForeignKey(x => x.AgriculturalProductTemplateSpecificationOptionId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductInquiry>(inquiry =>
        {
            inquiry.HasOne(x => x.Listing).WithMany(x => x.Inquiries)
                .HasForeignKey(x => x.ListingId).OnDelete(DeleteBehavior.Restrict);
            inquiry.HasOne(x => x.Buyer).WithMany()
                .HasForeignKey(x => x.BuyerId).OnDelete(DeleteBehavior.Restrict);
            inquiry.HasOne(x => x.Seller).WithMany()
                .HasForeignKey(x => x.SellerId).OnDelete(DeleteBehavior.Restrict);
            inquiry.HasIndex(x => new { x.BuyerId, x.ListingId, x.Status });
            inquiry.HasIndex(x => new { x.SellerId, x.Status, x.CreatedAt });
        });

        // کد هر رکورد باید در کل جدول یکتا بماند، حتی بعد از حذف نرم.
        var entityTypes = modelBuilder.Model.GetEntityTypes()
            .Where(e => typeof(BaseEntity).IsAssignableFrom(e.ClrType));

        foreach (var entityType in entityTypes)
        {
            // An alternate key already has a unique index (e.g. a delivery point's Code).
            if (entityType.GetKeys().Any(k => k.Properties.Count == 1 && k.Properties[0].Name == nameof(BaseEntity.Code)))
                continue;

            modelBuilder.Entity(entityType.ClrType)
                .HasIndex(nameof(BaseEntity.Code))
                .IsUnique(); 
        }
    }

}
