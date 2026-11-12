using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Shared.Exceptions;

namespace AlooGiyah_Application.Services.Store;

public static class DiscountFunding
{
    public static void Snapshot(AgriculturalOrder order, bool sellerFunded)
    {
        order.DiscountFundingSource = order.DiscountAmount > 0 ? sellerFunded ? "Seller" : "Platform" : null;
        order.PlatformDiscountAmount = sellerFunded ? 0 : order.DiscountAmount;
        order.SellerDiscountAmount = sellerFunded ? order.DiscountAmount : 0;
    }
    public static decimal SellerGross(AgriculturalOrder order)
    {
        // Historical orders have no funding snapshot; never silently rewrite their accounting.
        if (order.DiscountFundingSource == null)
        {
            if (order.PlatformDiscountAmount != 0 || order.SellerDiscountAmount != 0)
                throw new ConflictException("منبع تخفیف سفارش مشخص نیست.");
            return order.TotalPrice - (order.CompanyDelivery ? order.ShippingAmount : 0);
        }
        if (order.PlatformDiscountAmount < 0 || order.SellerDiscountAmount < 0 ||
            order.PlatformDiscountAmount + order.SellerDiscountAmount != order.DiscountAmount ||
            order.DiscountFundingSource == "Platform" && order.SellerDiscountAmount != 0 ||
            order.DiscountFundingSource == "Seller" && order.PlatformDiscountAmount != 0 ||
            order.DiscountFundingSource is not ("Platform" or "Seller"))
            throw new ConflictException("سهم تأمین تخفیف سفارش معتبر نیست.");
        return order.TotalPrice + order.PlatformDiscountAmount - (order.CompanyDelivery ? order.ShippingAmount : 0);
    }
}
