using AlooGiyah_Domain.Entities.Store;

namespace AlooGiyah_Application.Utils;

public static class ProductOfferPricing
{
    public static AgriculturalProductOffer? ActiveOffer(AgriculturalProduct product, DateTimeOffset now) =>
        product.Offers.Where(o => !o.IsDeleted && o.IsActive && o.Percentage > 0 && o.Percentage <= 100 &&
            o.StartsAt <= now && o.EndsAt > now)
        .OrderByDescending(o => o.Percentage).ThenByDescending(o => o.AgriculturalProductOfferId).FirstOrDefault();

    public static decimal UnitPrice(AgriculturalProduct product, decimal price, DateTimeOffset now) =>
        decimal.Round(price * (1 - (ActiveOffer(product, now)?.Percentage ?? 0) / 100m), 2);
}
