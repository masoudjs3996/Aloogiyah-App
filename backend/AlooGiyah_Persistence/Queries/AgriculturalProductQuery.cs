using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Persistence.Queries;
public class AgriculturalProductQuery : BaseQuery, IAgriculturalProductQuery
{

    private readonly ICurrentUserService _user;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;
    public AgriculturalProductQuery(IDbConnectionFactory factory, ICurrentUserService user, Microsoft.Extensions.Configuration.IConfiguration configuration) : base(factory)
    { _user = user; _configuration = configuration; }
    private const string Projection = """
to_jsonb(t) || jsonb_build_object('FarmCode', f."Code", 'StatusCode', s."Code", 'WholesalePrice', CASE WHEN @Wholesale THEN t."WholesalePrice" ELSE NULL END, 'PrimaryImageUrl', COALESCE((SELECT fi."Url" FROM "Files" fi WHERE fi."EntityCode"=t."Code" AND fi."EntityFile"=3 AND fi."IsPrimary" AND NOT fi."IsDeleted" ORDER BY fi."CreatedAt" DESC, fi."FileId" DESC LIMIT 1), '/images/default-product.jpg'), 'CategoryCodes', COALESCE((SELECT jsonb_agg(c."Code" ORDER BY c."CategoryId") FROM "AgriculturalProductCategory" j JOIN "Categories" c ON c."CategoryId"=j."CategoriesCategoryId" WHERE j."AgriculturalProductsAgriculturalProductId"=t."AgriculturalProductId" AND NOT c."IsDeleted"), '[]'::jsonb), 'ImageUrls', COALESCE((SELECT jsonb_agg(fi."Url" ORDER BY fi."IsPrimary" DESC,fi."CreatedAt",fi."FileId") FROM "Files" fi WHERE fi."EntityCode"=t."Code" AND fi."EntityFile"=3 AND NOT fi."IsDeleted"), '[]'::jsonb))
""";
    private const string From = """
FROM "AgriculturalProducts" t JOIN "Farms" f ON f."FarmId"=t."FarmId" JOIN "Statuses" s ON s."StatusId"=t."StatusId"
""";
    private bool Wholesale => _user.Roles.Any(role => _configuration.GetSection("Commerce:WholesaleRoles").GetChildren().Any(x => x.Value == role));
    private QueryFilter Filter()
    { var where = new QueryFilter(); where.Add("NOT f.\"IsDeleted\""); where.Parameters.Add("Wholesale", Wholesale); return where; }
    public Task<AgriculturalProductDetailDto?> GetByCodeAsync(string code, string role)
    { var where = Filter(); where.Add("t.\"Code\"=@Code", "Code", code); return QueryJsonFirstAsync<AgriculturalProductDetailDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters); }
    public Task<PagedResult<AgriculturalProductListItemDto>> GetByFilterAsync(AgriculturalProductFilterDto filter, string role)
    {
        var where = Filter(); where.Contains("t.\"Name\"", "Name", filter.Name);
        where.Equal("f.\"Code\"", "Farm", filter.FarmCode); where.Equal("s.\"Code\"", "Status", filter.StatusCode);
        var price = Wholesale ? "t.\"WholesalePrice\"" : "t.\"RetailPrice\"";
        where.Compare(price, ">=", "MinPrice", filter.MinPrice); where.Compare(price, "<=", "MaxPrice", filter.MaxPrice);
        where.Compare("t.\"Stock\"", ">=", "MinStock", filter.MinStock); where.Compare("t.\"Stock\"", "<=", "MaxStock", filter.MaxStock);
        if (filter.CategoryCodes?.Count > 0) where.Add("EXISTS (SELECT 1 FROM \"AgriculturalProductCategory\" j JOIN \"Categories\" c ON c.\"CategoryId\"=j.\"CategoriesCategoryId\" WHERE j.\"AgriculturalProductsAgriculturalProductId\"=t.\"AgriculturalProductId\" AND NOT c.\"IsDeleted\" AND c.\"Code\"=ANY(@Categories))", "Categories", filter.CategoryCodes.ToArray());
        return QueryJsonPagedAsync<AgriculturalProductListItemDto>(Projection, From, where, "t.\"CreatedAt\" DESC,t.\"AgriculturalProductId\" DESC", filter.PageNumber, filter.PageSize);
    }
    public Task<PagedResult<AgriculturalProductSimilarDto>> GetSimilarAsync(AgriculturalProductSimilarFilterDto filter)
    {
        var where = Filter(); where.Add("t.\"Code\"<>@Code", "Code", filter.ProductCode);
        where.Add("s.\"Code\"='251BC4A57D' AND NOT s.\"IsDeleted\"");
        var categoryMatch = """
EXISTS (SELECT 1 FROM "AgriculturalProductCategory" mine JOIN "AgriculturalProductCategory" other ON other."CategoriesCategoryId"=mine."CategoriesCategoryId" WHERE mine."AgriculturalProductsAgriculturalProductId"=t."AgriculturalProductId" AND other."AgriculturalProductsAgriculturalProductId"=current."AgriculturalProductId")
""";
        where.Add("(t.\"FarmId\"=current.\"FarmId\" OR " + categoryMatch + ")");
        var from = From + """
 CROSS JOIN (SELECT "AgriculturalProductId","FarmId" FROM "AgriculturalProducts" WHERE "Code"=@Code AND NOT "IsDeleted") current
""";
        var projection = Projection + """
 || jsonb_build_object('ProductImageUrl', (SELECT fi."Url" FROM "Files" fi WHERE fi."EntityCode"=t."Code" AND fi."EntityFile"=3 AND fi."IsPrimary" AND NOT fi."IsDeleted" ORDER BY fi."CreatedAt" DESC, fi."FileId" DESC LIMIT 1))
""";
        var order = "(CASE WHEN t.\"FarmId\"=current.\"FarmId\" AND " + categoryMatch + " THEN 3 WHEN t.\"FarmId\"=current.\"FarmId\" THEN 2 ELSE 1 END) DESC,t.\"CreatedAt\" DESC,t.\"AgriculturalProductId\" DESC";
        return QueryJsonPagedAsync<AgriculturalProductSimilarDto>(projection, from, where, order, filter.PageNumber, filter.PageSize);
    }
}
