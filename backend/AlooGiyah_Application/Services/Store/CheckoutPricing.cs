namespace AlooGiyah_Application.Services.Store;
public static class CheckoutPricing
{
    // Money uses two fractional digits. Distribute rounding remainder without
    // exceeding any farm's eligible subtotal (even for tiny amounts).
    public static Dictionary<int, decimal> AllocateDiscount(IReadOnlyDictionary<int, decimal> eligible, decimal discount)
    {
        var total = eligible.Values.Sum();
        if (eligible.Values.Any(x => x < 0) || discount < 0 || discount > total)
            throw new ArgumentOutOfRangeException(nameof(discount));
        var result = eligible.ToDictionary(x => x.Key, _ => 0m);
        if (total == 0) return result;
        var farms = eligible.Where(x => x.Value > 0).OrderBy(x => x.Key).ToList();
        decimal remaining = discount;
        for (var i = 0; i < farms.Count; i++)
        {
            var allocated = Math.Min(farms[i].Value,
                decimal.Round(discount * farms[i].Value / total, 2, MidpointRounding.ToZero));
            result[farms[i].Key] = allocated; remaining -= allocated;
        }
        for (var i = farms.Count - 1; i >= 0 && remaining > 0; i--)
        {
            var farm = farms[i];
            var extra = Math.Min(remaining, farm.Value - result[farm.Key]);
            result[farm.Key] += extra;
            remaining -= extra;
        }
        return result;
    }
}
