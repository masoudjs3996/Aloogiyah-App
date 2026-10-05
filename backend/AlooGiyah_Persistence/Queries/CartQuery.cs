using AlooGiyah_Application.DTOs.Cart;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Persistence.Queries;
public class CartQuery : BaseQuery, ICartQuery
{
    private readonly ICurrentUserService _user;

    private readonly AlooGiyah_Application.Interfaces.Service.IPriceCalculatorService _pricing;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;
    public CartQuery(IDbConnectionFactory factory, ICurrentUserService user,
        AlooGiyah_Application.Interfaces.Service.IPriceCalculatorService pricing, Microsoft.Extensions.Configuration.IConfiguration configuration) : base(factory)
    { _user = user; _pricing = pricing; _configuration = configuration; }
    private sealed class CartRead
    { public CartRead() { } public AlooGiyah_Domain.Entities.Store.Cart Cart { get; set; } = null!; public List<MediaRead> Media { get; set; } = new(); }
    private sealed class MediaRead
    { public MediaRead() { } public string Code { get; set; } = ""; public int Entity { get; set; } public string? Url { get; set; } }
    public Task<CartDto?> GetCartAsync() => ReadAsync(null);
    public Task<CartDto?> GetCartByIdAsync(Guid cartId) => ReadAsync(cartId);
    private async Task<CartDto?> ReadAsync(Guid? cartId)
    {
        if (!_user.IsAuthenticated) throw new UnauthorizedException("توکن کاربر یا مهمان الزامی است.");
        var where = new List<string> { "NOT c.\"IsDeleted\"" }; var parameters = new Dapper.DynamicParameters();
        if (_user.IsGuest)
        {
            if (!Guid.TryParse(_user.CartId, out var guest) || guest == Guid.Empty) return null;
            where.Add("c.\"CartId\"=@Guest AND c.\"UserId\" IS NULL"); parameters.Add("Guest", guest);
        }
        else { where.Add("c.\"UserId\"=@UserId"); parameters.Add("UserId", QueryAccess.UserId(_user)); }
        if (cartId.HasValue) { where.Add("c.\"CartId\"=@CartId"); parameters.Add("CartId", cartId.Value); }
        var sql = """
SELECT (jsonb_build_object('Cart', to_jsonb(c) || jsonb_build_object('User', jsonb_build_object('Code',u."Code"), 'Discount', CASE WHEN d."DiscountId" IS NULL THEN NULL ELSE to_jsonb(d) || jsonb_build_object('Farm', (to_jsonb(df) || jsonb_build_object('Owner',jsonb_build_object('UserId',df."OwnerId"),'Status',jsonb_build_object('StatusId',df."StatusId"))), 'Users', COALESCE((SELECT jsonb_agg(jsonb_build_object('Code',u."Code",'UserId',u."UserId")) FROM "DiscountUsers" j JOIN "Users" u ON u."UserId"=j."UsersUserId" WHERE j."DiscountsDiscountId"=d."DiscountId" AND NOT u."IsDeleted"), '[]'::jsonb), 'Products', COALESCE((SELECT jsonb_agg(to_jsonb(p)) FROM "DiscountProducts" j JOIN "Products" p ON p."ProductId"=j."ProductsProductId" WHERE j."DiscountsDiscountId"=d."DiscountId" AND NOT p."IsDeleted"), '[]'::jsonb), 'agriculturalProducts', COALESCE((SELECT jsonb_agg(to_jsonb(p)) FROM "DiscountAgriculturalProducts" j JOIN "AgriculturalProducts" p ON p."AgriculturalProductId"=j."agriculturalProductsAgriculturalProductId" WHERE j."DiscountsDiscountId"=d."DiscountId" AND NOT p."IsDeleted"), '[]'::jsonb), 'Categories', COALESCE((SELECT jsonb_agg(to_jsonb(c) || jsonb_build_object('ParentCategory', (WITH RECURSIVE ancestors AS (
SELECT pc.*, ARRAY[pc."CategoryId"] AS path FROM "Categories" pc WHERE pc."CategoryId"=c."ParentCategoryId" AND NOT pc."IsDeleted"
UNION ALL SELECT pc.*, ancestors.path || pc."CategoryId" FROM "Categories" pc JOIN ancestors ON pc."CategoryId"=ancestors."ParentCategoryId" WHERE NOT pc."IsDeleted" AND NOT pc."CategoryId"=ANY(ancestors.path)
) SELECT to_jsonb(a) - 'path' FROM ancestors a ORDER BY cardinality(a.path) DESC LIMIT 1)) ORDER BY c."SortOrder",c."CategoryId") FROM "Categories" c WHERE c."DiscountId"=d."DiscountId" AND NOT c."IsDeleted"), '[]'::jsonb)) END, 'CartItems', COALESCE((SELECT jsonb_agg(to_jsonb(i) || jsonb_build_object('AgriculturalProduct', to_jsonb(p) || jsonb_build_object('Categories', COALESCE((SELECT jsonb_agg(to_jsonb(cat)) FROM "AgriculturalProductCategory" j JOIN "Categories" cat ON cat."CategoryId"=j."CategoriesCategoryId" WHERE j."AgriculturalProductsAgriculturalProductId"=p."AgriculturalProductId" AND NOT cat."IsDeleted"), '[]'::jsonb), 'Farm', (to_jsonb(f) || jsonb_build_object('Owner',jsonb_build_object('UserId',f."OwnerId"),'Status',jsonb_build_object('StatusId',f."StatusId"))) || jsonb_build_object('Address', to_jsonb(a) || jsonb_build_object('Province', to_jsonb(prov), 'County', to_jsonb(county))))) ORDER BY i."CartItemId") FROM "CartItems" i JOIN "AgriculturalProducts" p ON p."AgriculturalProductId"=i."AgriculturalProductId" JOIN "Farms" f ON f."FarmId"=p."FarmId" LEFT JOIN "Addresses" a ON a."AddressId"=f."AddressId" LEFT JOIN "Provinces" prov ON prov."ProvinceId"=a."ProvinceId" LEFT JOIN "Countys" county ON county."CountyId"=a."CountyId" WHERE i."CartId"=c."CartId" AND NOT i."IsDeleted" AND NOT p."IsDeleted" AND NOT f."IsDeleted"), '[]'::jsonb)), 'Media', COALESCE((SELECT jsonb_agg(jsonb_build_object('Code',fi."EntityCode",'Entity',fi."EntityFile",'Url',fi."Url") ORDER BY fi."CreatedAt" DESC,fi."FileId" DESC) FROM "Files" fi WHERE NOT fi."IsDeleted" AND fi."IsPrimary" AND EXISTS (
SELECT 1 FROM "CartItems" ci JOIN "AgriculturalProducts" p ON p."AgriculturalProductId"=ci."AgriculturalProductId" JOIN "Farms" f ON f."FarmId"=p."FarmId" WHERE ci."CartId"=c."CartId" AND NOT ci."IsDeleted" AND ((fi."EntityFile"=3 AND fi."EntityCode"=p."Code") OR (fi."EntityFile"=6 AND fi."EntityCode"=f."Code")))), '[]'::jsonb)))::text FROM "Carts" c LEFT JOIN "Users" u ON u."UserId"=c."UserId" LEFT JOIN "Discounts" d ON d."DiscountId"=c."DiscountId" AND NOT d."IsDeleted" LEFT JOIN "Farms" df ON df."FarmId"=d."FarmId"
""" + " WHERE " + string.Join(" AND ", where) + " ORDER BY c.\"CreatedAt\" DESC,c.\"CartId\" LIMIT 1";
        var read = await QueryJsonFirstAsync<CartRead>(sql, parameters); if (read == null) return null;
        var cart = read.Cart;
        var wholesaleRoles = _configuration.GetSection("Commerce:WholesaleRoles");
        var roleNames = wholesaleRoles.GetChildren().Select(x => x.Value).ToList();
        var role = _user.Roles.FirstOrDefault(x => roleNames.Contains(x)) ?? "Guest";
        _pricing.CalculateCart(cart, role);
        var eligible = new Dictionary<int, decimal>();
        var validDiscount = cart.Discount != null && _pricing.IsDiscountValid(cart.Discount, cart.User?.Code);
        foreach (var group in cart.CartItems.GroupBy(x => x.AgriculturalProduct.FarmId))
        {
            decimal sum = 0;
            foreach (var line in group) if (validDiscount && await _pricing.IsProductEligibleForDiscountAsync(line.AgriculturalProduct, cart.Discount!)) sum += line.Price;
            eligible[group.Key] = sum;
        }
        var allocations = AlooGiyah_Application.Services.Store.CheckoutPricing.AllocateDiscount(eligible, cart.DiscountAmount);
        string? Image(int entity, string code) => read.Media.FirstOrDefault(x => x.Entity == entity && x.Code == code)?.Url;
        return new CartDto { CartId = cart.CartId, Code = cart.Code, IsGuest = cart.UserId == null,
            Farms = cart.CartItems.GroupBy(x => x.AgriculturalProduct.FarmId).OrderBy(x => x.Key).Select(group =>
            {
                var farm = group.First().AgriculturalProduct.Farm;
                return new FarmCartDto { FarmCode = farm.Code, FarmName = farm.Name, DiscountAmount = allocations[group.Key],
                    TotalPrice = group.Sum(x => x.Price) - allocations[group.Key], ImageUrl = Image(6, farm.Code),
                    Province = farm.Address?.Province?.Name ?? "", County = farm.Address?.County?.Name ?? "",
                    Items = group.Select(x => new CartItemDto { Code = x.Code, ProductCode = x.AgriculturalProduct.Code,
                        ProductName = x.AgriculturalProduct.Name, ProductSlug = x.AgriculturalProduct.Slug, Quantity = x.Quantity,
                        UnitPrice = x.Quantity > 0 ? x.Price / x.Quantity : 0, AvailableStock = x.AgriculturalProduct.Stock,
                        PrimaryImageUrl = Image(3, x.AgriculturalProduct.Code) }).ToList() };
            }).ToList() };
    }
}
