using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;

namespace AlooGiyah_Application.Services.Store;

// All callers hold the same serializable transaction as the purchase/booking update.
internal static class DeferredDeliveryFunds
{
    public static decimal KnownFee(DeliveryBooking b) => b.DestinationPointId.HasValue
        ? b.Legs.Where(l => !l.IsDeferred).Sum(l => l.Fee ?? 0) : b.Fee ?? 0;
    public static decimal? Proposed(DeliveryBooking b) => b.DeferredFeeLimit.HasValue &&
        b.Legs.Any(l => l.IsDeferred) && b.Legs.Where(l => l.IsDeferred).All(l => l.Fee.HasValue)
        ? b.Legs.Where(l => l.IsDeferred).Sum(l => l.Fee!.Value) : null;

    public static async Task Settle(DeliveryBooking b, Wallet wallet, IGenericRepository<WalletTransaction> ledger)
    {
        var amount = Proposed(b);
        if (b.DeferredFeePaid.HasValue || !amount.HasValue || b.Checkout?.IsSubmitted != true) return;
        var active = b.Checkout.Orders.Where(o => o.Status.Code != AgriculturalOrderStatuses.Rejected).ToList();
        if (active.Count == 0 || active.Any(o => !o.IsPaid))
            throw new ConflictException("ابتدا بررسی سفارش‌ها توسط مزرعه‌ها باید تمام شود.");
        if (amount > b.DeferredFeeLimit) return; // Only the buyer can authorize more.
        if (wallet.HeldAmount < b.HeldDeliveryFee || b.HeldDeliveryFee < amount || wallet.Balance < amount)
            throw new ConflictException("رزرو هزینه حمل معتبر نیست؛ بررسی پشتیبانی لازم است.");
        wallet.Balance -= amount.Value;
        wallet.HeldAmount -= b.HeldDeliveryFee;
        if (amount > 0) await Entry(ledger, wallet, b, amount.Value, WalletTransactionType.Withdrawal, "PAY", "تسویه هزینه حمل");
        if (b.HeldDeliveryFee > amount) await Entry(ledger, wallet, b, b.HeldDeliveryFee - amount.Value, WalletTransactionType.Release, "RELEASE", "آزادسازی باقیمانده رزرو حمل");
        b.HeldDeliveryFee = 0; b.DeferredFeePaid = amount.Value;
        b.Fee = KnownFee(b) + amount.Value; b.Version = Guid.NewGuid();
    }

    public static async Task ReleaseIfRejected(DeliveryBooking? b, Wallet wallet, IGenericRepository<WalletTransaction> ledger)
    {
        if (b?.HeldDeliveryFee is not > 0 || b.Checkout == null || b.Checkout.Orders.Any(o => o.Status.Code != AgriculturalOrderStatuses.Rejected)) return;
        if (wallet.HeldAmount < b.HeldDeliveryFee) throw new ConflictException("رزرو حمل معتبر نیست.");
        wallet.HeldAmount -= b.HeldDeliveryFee;
        await Entry(ledger, wallet, b, b.HeldDeliveryFee, WalletTransactionType.Release, "RELEASE", "آزادسازی رزرو حمل سفارش‌های ردشده");
        b.HeldDeliveryFee = 0; b.DeferredFeePaid = 0; b.Version = Guid.NewGuid();
    }

    public static Task Entry(IGenericRepository<WalletTransaction> ledger, Wallet wallet, DeliveryBooking b,
        decimal amount, WalletTransactionType type, string suffix, string description) => ledger.AddAsync(new WalletTransaction {
            WalletId = wallet.WalletId, Amount = amount, TransactionType = type,
            ReferenceId = "DELIVERY_" + suffix + "_" + b.Code, Description = description + " " + b.Code,
            CompletedAt = DateTimeOffset.UtcNow });
}
