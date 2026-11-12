using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Constants;
namespace AlooGiyah_Persistence.Queries;
public class AgriculturalProductQuery : BaseQuery, IAgriculturalProductQuery
{

    private readonly ICurrentUserService _user;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;
    public AgriculturalProductQuery(IDbConnectionFactory factory, ICurrentUserService user, Microsoft.Extensions.Configuration.IConfiguration configuration) : base(factory)
    { _user = user; _configuration = configuration; }
    private const string Projection = """
to_jsonb(t) || jsonb_build_object('FarmCode', f."Code", 'StatusCode', s."Code", 'WholesalePrice', CASE WHEN @Wholesale THEN t."WholesalePrice" ELSE NULL END, 'PrimaryImageUrl', COALESCE((SELECT fi."Url" FROM "Files" fi WHERE fi."EntityCode"=t."Code" AND fi."EntityFile"=3 AND fi."IsPrimary" AND NOT fi."IsDeleted" ORDER BY fi."CreatedAt" DESC, fi."FileId" DESC LIMIT 1), '/images/default-product.jpg'), 'CategoryCodes', COALESCE((SELECT jsonb_agg(c."Code" ORDER BY c."CategoryId") FROM "AgriculturalProductCategory" j JOIN "Categories" c ON c."CategoryId"=j."CategoriesCategoryId" WHERE j."AgriculturalProductsAgriculturalProductId"=t."AgriculturalProductId" AND NOT c."IsDeleted"), '[]'::jsonb), 'ImageUrls', COALESCE((SELECT jsonb_agg(fi."Url" ORDER BY fi."IsPrimary" DESC,fi."CreatedAt",fi."FileId") FROM "Files" fi WHERE fi."EntityCode"=t."Code" AND fi."EntityFile"=3 AND NOT fi."IsDeleted"), '[]'::jsonb))
""" + """
 || jsonb_build_object('DiscountPercentage', offer."Percentage", 'DiscountEndsAt', offer."EndsAt",
 'DiscountedRetailPrice', CASE WHEN offer."Percentage" IS NOT NULL THEN round(t."RetailPrice"*(1-offer."Percentage"/100),2) ELSE NULL END,
 'DiscountedWholesalePrice', CASE WHEN @Wholesale AND offer."Percentage" IS NOT NULL THEN round(t."WholesalePrice"*(1-offer."Percentage"/100),2) ELSE NULL END)
""";
    private static readonly string From = """
FROM "AgriculturalProducts" t JOIN "Farms" f ON f."FarmId"=t."FarmId" JOIN "Statuses" s ON s."StatusId"=t."StatusId"
""" + " LEFT JOIN LATERAL (" + ProductOfferSql.ActiveFor("t") + ") offer ON TRUE";
    private bool Wholesale => _user.Roles.Any(role => _configuration.GetSection("Commerce:WholesaleRoles").GetChildren().Any(x => x.Value == role));
    private QueryFilter Filter()
    { var where = new QueryFilter(); where.Add("NOT f.\"IsDeleted\""); where.Parameters.Add("Wholesale", Wholesale); return where; }
    public Task<AgriculturalProductDetailDto?> GetByCodeAsync(string code, string role)
    { var where = Filter(); where.Add("t.\"Code\"=@Code", "Code", code); return QueryJsonFirstAsync<AgriculturalProductDetailDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters); }
    public Task<PagedResult<AgriculturalProductListItemDto>> GetByFilterAsync(AgriculturalProductFilterDto filter, string role)
    {
        var where = Filter(); where.Contains("t.\"Name\"", "Name", filter.Name);
        if (!string.IsNullOrWhiteSpace(filter.DeliveryPointCode))
            where.Add("EXISTS (SELECT 1 FROM \"DeliveryPoints\" dp WHERE dp.\"Code\"=f.\"DeliveryPointCode\" AND dp.\"Code\"=@OriginPoint AND dp.\"IsActive\" AND NOT dp.\"IsDeleted\")", "OriginPoint", filter.DeliveryPointCode);
        if (!string.IsNullOrWhiteSpace(filter.DestinationPointCode))
            where.Add("""
                EXISTS (SELECT 1 FROM "DeliveryPoints" src JOIN "DeliveryPoints" dst ON dst."Code"=@DestinationPoint
                WHERE src."Code"=f."DeliveryPointCode" AND src."IsActive" AND NOT src."IsDeleted" AND dst."IsActive" AND NOT dst."IsDeleted"
                AND (src."DeliveryPointId"=dst."DeliveryPointId" OR EXISTS
                    (SELECT 1 FROM "DeliveryRoutes" r WHERE ((r."OriginPointId"=src."DeliveryPointId" AND r."DestinationPointId"=dst."DeliveryPointId") OR (r."IsBidirectional" AND r."OriginPointId"=dst."DeliveryPointId" AND r."DestinationPointId"=src."DeliveryPointId")) AND r."IsActive" AND NOT r."IsDeleted")))
                """, "DestinationPoint", filter.DestinationPointCode);
        if (filter.DiscountedOnly == true) where.Add("offer.\"AgriculturalProductOfferId\" IS NOT NULL");
        where.Equal("f.\"Code\"", "Farm", filter.FarmCode); where.Equal("s.\"Code\"", "Status", filter.StatusCode);
        var price = Wholesale ? "t.\"WholesalePrice\"" : "t.\"RetailPrice\"";
        price = $"round({price}*(1-COALESCE(offer.\"Percentage\",0)/100),2)";
        where.Compare(price, ">=", "MinPrice", filter.MinPrice); where.Compare(price, "<=", "MaxPrice", filter.MaxPrice);
        where.Compare("t.\"Stock\"", ">=", "MinStock", filter.MinStock); where.Compare("t.\"Stock\"", "<=", "MaxStock", filter.MaxStock);
        if (filter.CategoryCodes?.Count > 0) where.Add("EXISTS (SELECT 1 FROM \"AgriculturalProductCategory\" j JOIN \"Categories\" c ON c.\"CategoryId\"=j.\"CategoriesCategoryId\" WHERE j.\"AgriculturalProductsAgriculturalProductId\"=t.\"AgriculturalProductId\" AND NOT c.\"IsDeleted\" AND c.\"Code\"=ANY(@Categories))", "Categories", filter.CategoryCodes.ToArray());
        // Only fixed SQL expressions are selected; client text is never interpolated.
        var sort = filter.SortColumn?.Trim().ToLowerInvariant() switch
        {
            "retailprice" or "price" or "wholesaleprice" => price,
            "stock" => "t.\"Stock\"",
            "name" => "t.\"Name\"",
            _ => "t.\"CreatedAt\""
        };
        var direction = filter.SortDescending ? "DESC" : "ASC";
        var order = $"{sort} {direction},t.\"AgriculturalProductId\" DESC";
        where.Parameters.Add("SellableStatus", AgriculturalProductStatuses.Sellable);
        var projection = Projection + """
            || jsonb_build_object('IsSellable', s."Code"=@SellableStatus AND NOT s."IsDeleted")
            """;
        return QueryJsonPagedAsync<AgriculturalProductListItemDto>(projection, From, where, order, filter.PageNumber, filter.PageSize);
    }
    public Task<PagedResult<AgriculturalProductSimilarDto>> GetSimilarAsync(AgriculturalProductSimilarFilterDto filter)
    {
        var where = Filter(); where.Add("t.\"Code\"<>@Code", "Code", filter.ProductCode);
        where.Add("s.\"Code\"=@SellableStatus AND NOT s.\"IsDeleted\"", "SellableStatus", AgriculturalProductStatuses.Sellable);
        var categoryMatch = """
EXISTS (SELECT 1 FROM "AgriculturalProductCategory" mine JOIN "AgriculturalProductCategory" other ON other."CategoriesCategoryId"=mine."CategoriesCategoryId" WHERE mine."AgriculturalProductsAgriculturalProductId"=t."AgriculturalProductId" AND other."AgriculturalProductsAgriculturalProductId"=current."AgriculturalProductId")
""";
        where.Add("(t.\"FarmId\"=current.\"FarmId\" OR " + categoryMatch + ")");
        var from = From + """
 CROSS JOIN (SELECT "AgriculturalProductId","FarmId" FROM "AgriculturalProducts" WHERE "Code"=@Code AND NOT "IsDeleted") current
""";
        var projection = Projection + """
 || jsonb_build_object('PrimaryImageUrl', COALESCE((SELECT fi."Url" FROM "Files" fi WHERE fi."EntityCode"=t."Code" AND fi."EntityFile"=3 AND fi."IsPrimary" AND NOT fi."IsDeleted" ORDER BY fi."CreatedAt" DESC, fi."FileId" DESC LIMIT 1), '/placeholder.svg'))
""";
        var order = "(CASE WHEN t.\"FarmId\"=current.\"FarmId\" AND " + categoryMatch + " THEN 3 WHEN t.\"FarmId\"=current.\"FarmId\" THEN 2 ELSE 1 END) DESC,t.\"CreatedAt\" DESC,t.\"AgriculturalProductId\" DESC";
        return QueryJsonPagedAsync<AgriculturalProductSimilarDto>(projection, from, where, order, filter.PageNumber, filter.PageSize);
    }
}
