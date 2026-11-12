using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Shared.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Application.Services.Store;

public partial class DeliveryService
{
    private async Task<DeliveryRoute> TariffRoute(string code) => routes == null
        ? throw new InvalidOperationException("Route repository is required.")
        : await routes.GetAll().Include(r => r.OriginPoint).Include(r => r.DestinationPoint)
            .SingleOrDefaultAsync(r => r.Code == code) ?? throw new NotFoundException("مسیر یافت نشد.");

    private async Task<Dictionary<int, Category>> TariffCategoryTree()
    {
        if (tariffCategories == null) throw new InvalidOperationException("Category repository is required.");
        return await tariffCategories.GetAll().AsNoTracking().ToDictionaryAsync(c => c.CategoryId);
    }

    private static List<Category> CategoryPath(Category category, IReadOnlyDictionary<int, Category> tree)
    {
        var result = new List<Category>(); var seen = new HashSet<int>();
        Category? current = category;
        while (current != null && seen.Add(current.CategoryId))
        {
            result.Add(current);
            current = current.ParentCategoryId.HasValue && tree.TryGetValue(current.ParentCategoryId.Value, out var parent) ? parent : null;
        }
        result.Reverse(); return result;
    }

    public async Task<object> TariffCategories(string routeCode, string? search)
    {
        RequireManager(); await TariffRoute(routeCode);
        var tree = await TariffCategoryTree();
        return tree.Values.Select(c => new { c.Code, Name = string.Join(" / ", CategoryPath(c, tree).Select(n => n.Name)) })
            .Where(c => string.IsNullOrWhiteSpace(search) || c.Name.Contains(search.Trim(), StringComparison.OrdinalIgnoreCase) || c.Code == search.Trim())
            .OrderBy(c => c.Name).ToList();
    }

    public async Task<object> CategoryTariffs(string routeCode)
    {
        RequireManager(); var route = await TariffRoute(routeCode);
        if (tariffs == null) throw new InvalidOperationException("Tariff repository is required.");
        var tree = await TariffCategoryTree();
        var rows = await tariffs.GetAll().Include(t => t.Category).AsNoTracking()
            .Where(t => t.DeliveryRouteId == route.DeliveryRouteId).OrderBy(t => t.Category.Name).ThenBy(t => t.SaleUnit).ToListAsync();
        return rows.Select(t => new { t.Code, CategoryCode = t.Category.Code,
            Name = string.Join(" / ", CategoryPath(t.Category, tree).Select(n => n.Name)), t.SaleUnit, t.BlockSize, t.PricePerBlock,
            NeedsReview = t.Category.IsDeleted });
    }

    public async Task SaveCategoryTariff(string routeCode, DeliveryCategoryTariffInput dto)
    {
        RequireManager(); Money(dto.PricePerBlock);
        if (dto.BlockSize <= 0 || dto.SaleUnit is not ("Kilogram" or "Package" or "Piece"))
            throw new BadRequestException("واحد فروش و مقدار صحیح مثبت برای هر واحد حمل انتخاب کنید.");
        if (tariffs == null || tariffCategories == null) throw new InvalidOperationException("Tariff repositories are required.");
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var route = await TariffRoute(routeCode);
        var category = await tariffCategories.GetAll().SingleOrDefaultAsync(c => c.Code == dto.CategoryCode)
            ?? throw new NotFoundException("دسته‌بندی یافت نشد.");
        var tariff = await tariffs.GetAllIncludingDeleted().SingleOrDefaultAsync(t => t.DeliveryRouteId == route.DeliveryRouteId && t.CategoryId == category.CategoryId && t.SaleUnit == dto.SaleUnit);
        if (tariff == null)
        {
            tariff = new DeliveryCategoryTariff { Route = route, Category = category, SaleUnit = dto.SaleUnit };
            await tariffs.AddAsync(tariff);
        }
        tariff.BlockSize = dto.BlockSize; tariff.PricePerBlock = dto.PricePerBlock;
        tariff.IsDeleted = false; tariff.UpdatedAt = DateTimeOffset.UtcNow;
        await unit.SaveChangesAsync(); await tx.CommitAsync();
    }

    public async Task RemoveCategoryTariff(string routeCode, string categoryCode, string saleUnit)
    {
        RequireManager();
        if (tariffs == null) throw new InvalidOperationException("Tariff repository is required.");
        var tariff = await tariffs.GetAll().SingleOrDefaultAsync(t => t.Route.Code == routeCode && !t.Route.IsDeleted && t.Category.Code == categoryCode && t.SaleUnit == saleUnit)
            ?? throw new NotFoundException("تعرفه یافت نشد.");
        tariff.IsDeleted = true; tariff.UpdatedAt = DateTimeOffset.UtcNow; await unit.SaveChangesAsync();
    }

    internal static (decimal? Fee, List<DeliveryTariffLineDto> Details) RoutePrice(DeliveryRoute route, IEnumerable<CartItem> items, IReadOnlyDictionary<int, Category> tree)
    {
        var products = items.GroupBy(i => i.AgriculturalProductId).ToList();
        if (route.PricingMode == "Flat")
            return (route.MaxQuantity.HasValue && products.Sum(g => g.Sum(i => (long)i.Quantity)) > route.MaxQuantity.Value ? null : route.Fee, []);
        var details = new List<DeliveryTariffLineDto>();
        var resolved = new List<(DeliveryCategoryTariff Tariff, long Quantity)>();
        var needsBaseFee = false;
        foreach (var group in products)
        {
            var product = group.First().AgriculturalProduct; var quantity = group.Sum(i => (long)i.Quantity);
            var ancestorIds = (product.Categories ?? []).Where(c => !c.IsDeleted && tree.ContainsKey(c.CategoryId))
                .SelectMany(c => CategoryPath(c, tree)).Select(c => c.CategoryId).ToHashSet();
            var matches = route.CategoryTariffs.Where(t => !t.IsDeleted && t.SaleUnit == product.SaleUnit && tree.ContainsKey(t.CategoryId) && ancestorIds.Contains(t.CategoryId))
                .Select(t => new { Tariff = t, Depth = CategoryPath(tree[t.CategoryId], tree).Count }).ToList();
            if (matches.Count == 0 && route.Fee.HasValue)
            {
                needsBaseFee = true;
                continue;
            }
            var maxDepth = matches.Select(m => m.Depth).DefaultIfEmpty(0).Max();
            var deepest = matches.Where(m => m.Depth == maxDepth).OrderBy(m => m.Tariff.CategoryId).ToList();
            // Equally specific but different prices/sizes are an ambiguous classification.
            var compatible = deepest.Select(m => new { m.Tariff.BlockSize, m.Tariff.PricePerBlock }).Distinct().Count() == 1;
            if (!compatible)
                details.Add(new("product:" + product.Code, null, product.Name, quantity, product.SaleUnit, null, null, null, null));
            else resolved.Add((deepest[0].Tariff, quantity));
        }
        foreach (var group in resolved.GroupBy(x => x.Tariff.Code))
        {
            var tariff = group.First().Tariff; var quantity = group.Sum(x => x.Quantity);
            var blocks = (long)decimal.Ceiling((decimal)quantity / tariff.BlockSize);
            var category = tree[tariff.CategoryId];
            details.Add(new(tariff.Code, category.Code, string.Join(" / ", CategoryPath(category, tree).Select(c => c.Name)), quantity,
                tariff.SaleUnit, tariff.BlockSize, blocks, tariff.PricePerBlock, blocks * tariff.PricePerBlock));
        }
        if (needsBaseFee)
            details.Add(new("base:" + route.Code, null, "کرایه پایه اقلام بدون تعرفه", 0, null, null, null, null, route.Fee));
        decimal? total = details.All(d => d.Fee.HasValue) ? details.Sum(d => d.Fee!.Value) : null;
        return (total > 1_000_000_000m ? null : total, details);
    }

    public async Task<object> IncreaseTariffs(DeliveryTariffIncreaseInput dto, bool apply)
    {
        RequireManager();
        if (routes == null || tariffs == null) throw new InvalidOperationException("Tariff repositories are required.");
        if (dto.Percent <= 0 || dto.Percent > 1000 || decimal.Round(dto.Percent, 2) != dto.Percent)
            throw new BadRequestException("درصد افزایش باید بیشتر از صفر و حداکثر ۱۰۰۰، با حداکثر دو رقم اعشار باشد.");
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var routeFees = await routes.GetAll().Include(r => r.OriginPoint).Include(r => r.DestinationPoint)
            .Where(r => r.Fee.HasValue).OrderBy(r => r.Code).ToListAsync();
        var rows = await tariffs.GetAll().Include(t => t.Category).Include(t => t.Route).ThenInclude(r => r.OriginPoint)
            .Include(t => t.Route).ThenInclude(r => r.DestinationPoint).Where(t => !t.Route.IsDeleted)
            .OrderBy(t => t.Code).ToListAsync();
        var tree = await TariffCategoryTree();
        decimal Increased(decimal value) { var next = decimal.Ceiling(value * (1 + dto.Percent / 100)); Money(next); return next; }
        var changes = routeFees.Select(r => new { Code = r.Code, Kind = r.PricingMode == "Flat" ? "Flat" : "Base", Route = r.OriginPoint.Name + (r.IsBidirectional ? " ↔ " : " ← ") + r.DestinationPoint.Name, Category = r.PricingMode == "Flat" ? "کرایه ثابت محموله" : "کرایه پایه اقلام بدون تعرفه", OldPrice = r.Fee!.Value, NewPrice = Increased(r.Fee.Value) })
            .Concat(rows.Select(t => new { Code = t.Code, Kind = "Category", Route = t.Route.OriginPoint.Name + (t.Route.IsBidirectional ? " ↔ " : " ← ") + t.Route.DestinationPoint.Name, Category = string.Join(" / ", CategoryPath(t.Category, tree).Select(c => c.Name)) + " (" + (t.SaleUnit == "Kilogram" ? "کیلوگرم" : t.SaleUnit == "Package" ? "بسته" : "عدد") + ")", OldPrice = t.PricePerBlock, NewPrice = Increased(t.PricePerBlock) })).ToList();
        var token = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { dto.Percent, Changes = changes, Units = rows.Select(t => new { t.Code, t.SaleUnit, t.BlockSize }) }))));
        if (apply)
        {
            if (string.IsNullOrWhiteSpace(dto.ExpectedToken) || dto.ExpectedToken != token)
                throw new ConflictException("تعرفه‌ها از زمان پیش‌نمایش تغییر کرده‌اند؛ پیش‌نمایش تازه بگیرید.");
            foreach (var route in routeFees) { route.Fee = Increased(route.Fee!.Value); route.UpdatedAt = DateTimeOffset.UtcNow; }
            foreach (var tariff in rows) { tariff.PricePerBlock = Increased(tariff.PricePerBlock); tariff.UpdatedAt = DateTimeOffset.UtcNow; }
            await unit.SaveChangesAsync();
        }
        await tx.CommitAsync();
        return new { Token = token, Count = changes.Count, FlatCount = routeFees.Count(r => r.PricingMode == "Flat"),
            BaseCount = routeFees.Count(r => r.PricingMode == "CategoryUnits"), CategoryCount = rows.Count,
            Items = changes.Take(100), Applied = apply };
    }
}
