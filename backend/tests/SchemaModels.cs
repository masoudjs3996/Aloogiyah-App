using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;

internal static class SchemaModels
{
    // Pin old-schema migration fixtures without keeping an extra application model in production.
    public static IModel BeforeInterHub(AlooGiyahDbContext context)
    {
        var builder = new ModelBuilder(ConventionSet.CreateConventionSet(context));
        typeof(AlooGiyahDbContext).GetMethod("OnModelCreating", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic)!
            .Invoke(context, [builder]);
        builder.Entity<DeliveryBooking>().Ignore(b => b.DestinationPoint).Ignore(b => b.DestinationPointId).Ignore(b => b.Legs);
        builder.Entity<DeliveryBooking>().Ignore(b => b.DeferredFeeLimit).Ignore(b => b.HeldDeliveryFee).Ignore(b => b.DeferredFeePaid);
        builder.Entity<AgriculturalProduct>().Ignore(p => p.SaleUnit);
        builder.Entity<AgriculturalOrderItem>().Ignore(p => p.SaleUnit);
        builder.Entity<DeliveryPoint>().Ignore(p => p.County).Ignore(p => p.CountyId);
        builder.Entity<AgriculturalOrderItem>().Ignore(i => i.ReceivedAtOriginQuantity);
        builder.Ignore<DeliveryCategoryTariff>(); builder.Ignore<DeliveryLeg>(); builder.Ignore<DeliveryRoute>();
        return builder.FinalizeModel();
    }
}
