using AlooGiyah_Application.DTOs.Product;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
namespace AlooGiyah_Persistence.Queries;
public class ProductQuery : BaseQuery, IProductQuery
{
    private readonly ICurrentUserService _currentUser;
    public ProductQuery(IDbConnectionFactory factory, ICurrentUserService currentUser) : base(factory)
    { _currentUser = currentUser; }
    private const string Projection = """
to_jsonb(t) || jsonb_build_object('CategoryCodes', COALESCE((SELECT jsonb_agg(c."Code" ORDER BY c."CategoryId") FROM "CategoryProduct" j JOIN "Categories" c ON c."CategoryId" = j."CategoriesCategoryId" WHERE j."ProductsProductId" = t."ProductId" AND NOT c."IsDeleted"), '[]'::jsonb), 'WholesalePrice', CASE WHEN @RetailOnly THEN NULL ELSE t."WholesalePrice" END)
""";
    private const string From = """
FROM "Products" t 
""";
    private QueryFilter BaseFilter()
    {
        var where = new QueryFilter();
        
        where.Parameters.Add("RetailOnly", _currentUser.IsGuest || _currentUser.Roles.Contains("User") || _currentUser.Roles.Contains("Buyer"));
        return where;
    }
    public Task<ProductDto?> GetByCodeAsync(string code)
    {
        var where = BaseFilter(); where.Add("t.\"Code\" = @Code", "Code", code);
        return QueryJsonFirstAsync<ProductDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters);
    }
    public Task<PagedResult<ProductDto>> GetByFilterAsync(ProductFilterDto filter)
    {
        var where = BaseFilter();
        where.Contains("""
t."Name"
""", "SearchTerm", filter.SearchTerm);
        if (!string.IsNullOrWhiteSpace(filter.CategoryCode)) where.Add("""
EXISTS (SELECT 1 FROM "CategoryProduct" j JOIN "Categories" c ON c."CategoryId"=j."CategoriesCategoryId" WHERE j."ProductsProductId"=t."ProductId" AND NOT c."IsDeleted" AND c."Code"=@CategoryCode)
""", "CategoryCode", filter.CategoryCode);
        return QueryJsonPagedAsync<ProductDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"ProductId\" DESC", filter.PageNumber, filter.PageSize);
    }
}
