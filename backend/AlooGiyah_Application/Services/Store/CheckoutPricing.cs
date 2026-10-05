namespace AlooGiyah_Application.Services.Store;
public static class CheckoutPricing
{
    // Money uses two fractional digits. Rounding remainder goes to the final eligible farm.
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
            var allocated = i == farms.Count - 1 ? remaining : Math.Min(remaining,
                decimal.Round(discount * farms[i].Value / total, 2, MidpointRounding.ToZero));
            result[farms[i].Key] = allocated; remaining -= allocated;
        }
        return result;
    }
}
