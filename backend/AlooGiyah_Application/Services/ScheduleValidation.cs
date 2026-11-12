using AlooGiyah_Shared.Exceptions;

namespace AlooGiyah_Application.Services;

public static class ScheduleValidation
{
    public const int MaximumDaysAhead = 20;

    public static void Validate(DateTimeOffset? value, DateTimeOffset? now = null)
    {
        if (!value.HasValue) return;
        var current = now ?? DateTimeOffset.UtcNow;
        // Inputs select whole minutes; accept the current minute consistently with the calendar.
        var earliest = DateTimeOffset.FromUnixTimeSeconds(current.ToUnixTimeSeconds() / 60 * 60);
        if (value.Value < earliest)
            throw new BadRequestException("انتخاب تاریخ و ساعت گذشته مجاز نیست.");
        if (value.Value > earliest.AddDays(MaximumDaysAhead))
            throw new BadRequestException("انتخاب تاریخ فقط تا ۲۰ روز آینده مجاز است.");
    }
}
