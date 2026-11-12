using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Application.Services;

public static class PaymentMoney
{
    public const string InternalCurrency = "IRT";
    public static long ToProviderUnits(decimal amountToman, string currency)
    {
        if (amountToman <= 0) throw new BadRequestException("مبلغ پرداخت باید مثبت باشد.");
        var multiplier = currency switch { "IRR" => 10m, "IRT" => 1m,
            _ => throw new BadRequestException("واحد پول پشتیبانی نمی‌شود.") };
        if (amountToman > long.MaxValue / multiplier) throw new BadRequestException("مبلغ پرداخت بیش از حد مجاز است.");
        var units = amountToman * multiplier;
        if (units > long.MaxValue || units != decimal.Truncate(units))
            throw new BadRequestException("مبلغ با واحد پول ارائه‌دهنده سازگار نیست.");
        return (long)units;
    }
}
