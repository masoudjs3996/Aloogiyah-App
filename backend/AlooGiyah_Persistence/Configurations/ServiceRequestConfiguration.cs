using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class ServiceRequestConfiguration : IEntityTypeConfiguration<ServiceRequest>
{
    public void Configure(EntityTypeBuilder<ServiceRequest> builder)
    {
        builder.HasKey(sr => sr.ServiceRequestId);

        builder.Property(sr => sr.ServiceType)
            .IsRequired();

        builder.Property(sr => sr.StatusId)
            .IsRequired();

        builder.Property(sr => sr.UserId)
            .IsRequired();

        builder.Property(sr => sr.Description)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(sr => sr.CreatedAt)
            .IsRequired();

        builder.Property(sr => sr.Price)
           .IsRequired()
           .HasPrecision(20, 2); 

        builder.Property(sr => sr.DiscountId);

        builder.Property(sr => sr.DiscountAmount)
            .IsRequired()
            .HasPrecision(20, 2);

        builder.Property(sr => sr.NumberOfVases);
        builder.Property(sr => sr.GardenArea);
        builder.Property(sr => sr.GreenhouseArea);



        builder.HasOne(sr => sr.Status)
            .WithMany(s => s.ServiceRequests)
            .HasForeignKey(sr => sr.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(sr => sr.User)
            .WithMany(u => u.ServiceRequests)
            .HasForeignKey(sr => sr.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(sr => sr.Provider)
            .WithMany(u => u.ProvidedServiceRequests)
            .HasForeignKey(sr => sr.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(sr => sr.Discount)
           .WithMany(d => d.ServiceRequests)
           .HasForeignKey(sr => sr.DiscountId)
           .OnDelete(DeleteBehavior.Restrict);
    }
}