using AlooGiyah_Shared.Exceptions;

namespace AlooGiyah_Application.Services.Store;

public static class SettlementPolicy
{
    public static readonly TimeZoneInfo Tehran = TimeZoneInfo.FindSystemTimeZoneById("Asia/Tehran");

    public static (DateOnly Saturday, DateTimeOffset Cutoff) Cycle(DateTimeOffset now)
    {
        var local = TimeZoneInfo.ConvertTime(now, Tehran);
        var date = DateOnly.FromDateTime(local.DateTime);
        var saturday = date.AddDays(((int)DayOfWeek.Saturday - (int)date.DayOfWeek + 7) % 7);
        DateTimeOffset Cutoff(DateOnly day)
        {
            var time = day.AddDays(-2).ToDateTime(new TimeOnly(12, 0));
            return new DateTimeOffset(time, Tehran.GetUtcOffset(time)).ToUniversalTime();
        }
        if (now >= Cutoff(saturday)) saturday = saturday.AddDays(7);
        return (saturday, Cutoff(saturday));
    }

    public static DateOnly PaymentDay(DateOnly saturday, IReadOnlyDictionary<DateOnly, bool> calendar)
    {
        for (var i = 0; i < 366; i++)
        {
            var day = saturday.AddDays(i);
            if (!calendar.TryGetValue(day, out var closed))
                throw new ConflictException("تقویم تسویه این بازه هنوز توسط مدیریت تأیید نشده است.");
            if (!closed && day.DayOfWeek != DayOfWeek.Friday) return day;
        }
        throw new ConflictException("روز کاری برای تسویه در تقویم یافت نشد.");
    }

    public static string NormalizeIban(string? input)
    {
        var iban = string.Concat((input ?? "").Where(c => !char.IsWhiteSpace(c))).ToUpperInvariant();
        if (iban.Length != 26 || !iban.StartsWith("IR") || !iban[2..].All(c => c is >= '0' and <= '9'))
            throw new BadRequestException("شماره شبای ایران معتبر وارد کنید.");
        var rearranged = iban[4..] + "1827" + iban[2..4];
        var remainder = 0;
        foreach (var c in rearranged) remainder = (remainder * 10 + c - '0') % 97;
        if (remainder != 1) throw new BadRequestException("شماره شبا معتبر نیست.");
        return iban;
    }
}
