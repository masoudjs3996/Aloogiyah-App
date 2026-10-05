using AlooGiyah_Application.DTOs.Discount;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Persistence.Queries;
public class DiscountQuery : BaseQuery, IDiscountQuery
{

    private readonly AutoMapper.IMapper _mapper;
    public DiscountQuery(IDbConnectionFactory factory, AutoMapper.IMapper mapper) : base(factory) { _mapper = mapper; }
    private const string Projection = """
to_jsonb(t) || jsonb_build_object('Farm', (to_jsonb(f) || jsonb_build_object('Owner',jsonb_build_object('UserId',f."OwnerId"),'Status',jsonb_build_object('StatusId',f."StatusId"))), 'Users', COALESCE((SELECT jsonb_agg(jsonb_build_object('Code',u."Code",'UserId',u."UserId")) FROM "DiscountUsers" j JOIN "Users" u ON u."UserId"=j."UsersUserId" WHERE j."DiscountsDiscountId"=t."DiscountId" AND NOT u."IsDeleted"), '[]'::jsonb), 'Products', COALESCE((SELECT jsonb_agg(to_jsonb(p)) FROM "DiscountProducts" j JOIN "Products" p ON p."ProductId"=j."ProductsProductId" WHERE j."DiscountsDiscountId"=t."DiscountId" AND NOT p."IsDeleted"), '[]'::jsonb), 'agriculturalProducts', COALESCE((SELECT jsonb_agg(to_jsonb(p)) FROM "DiscountAgriculturalProducts" j JOIN "AgriculturalProducts" p ON p."AgriculturalProductId"=j."agriculturalProductsAgriculturalProductId" WHERE j."DiscountsDiscountId"=t."DiscountId" AND NOT p."IsDeleted"), '[]'::jsonb), 'Categories', COALESCE((SELECT jsonb_agg(to_jsonb(c) || jsonb_build_object('ParentCategory', (WITH RECURSIVE ancestors AS (
SELECT pc.*, ARRAY[pc."CategoryId"] AS path FROM "Categories" pc WHERE pc."CategoryId"=c."ParentCategoryId" AND NOT pc."IsDeleted"
UNION ALL SELECT pc.*, ancestors.path || pc."CategoryId" FROM "Categories" pc JOIN ancestors ON pc."CategoryId"=ancestors."ParentCategoryId" WHERE NOT pc."IsDeleted" AND NOT pc."CategoryId"=ANY(ancestors.path)
) SELECT to_jsonb(a) - 'path' FROM ancestors a ORDER BY cardinality(a.path) DESC LIMIT 1)) ORDER BY c."SortOrder",c."CategoryId") FROM "Categories" c WHERE c."DiscountId"=t."DiscountId" AND NOT c."IsDeleted"), '[]'::jsonb))
""";
    private const string From = """
FROM "Discounts" t LEFT JOIN "Farms" f ON f."FarmId"=t."FarmId"
""";
    public async Task<DiscountDto?> GetByCodeAsync(string code)
    { var entity = await QueryJsonFirstAsync<AlooGiyah_Domain.Entities.Discount>($"SELECT ({Projection})::text {From} WHERE NOT t.\"IsDeleted\" AND t.\"Code\"=@Code", new { Code = code }); return entity == null ? null : _mapper.Map<DiscountDto>(entity); }
    public async Task<PagedResult<DiscountDto>> GetByFilterAsync(DiscountFilterDto filter)
    {
        var where = new QueryFilter(); where.Contains("t.\"Code\"", "Search", filter.SearchTerm);
        where.Equal("t.\"DiscountType\"", "Type", filter.DiscountType); where.Equal("t.\"IsActive\"", "Active", filter.IsActive);
        if (!string.IsNullOrWhiteSpace(filter.CategoryCodes))
        { where.Add("EXISTS (SELECT 1 FROM \"Categories\" c WHERE c.\"DiscountId\"=t.\"DiscountId\" AND NOT c.\"IsDeleted\" AND c.\"Code\"=ANY(@Codes))", "Codes", filter.CategoryCodes.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)); }
        var page = await QueryJsonPagedAsync<AlooGiyah_Domain.Entities.Discount>(Projection, From, where, "t.\"CreatedAt\" DESC,t.\"DiscountId\" DESC", filter.PageNumber, filter.PageSize);
        return new PagedResult<DiscountDto> { Items = page.Items.Select(x => _mapper.Map<DiscountDto>(x)).ToList(), PageNumber = page.PageNumber, PageSize = page.PageSize, TotalCount = page.TotalCount };
    }
}
