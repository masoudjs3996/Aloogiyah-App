using AlooGiyah_Application.DTOs.AgriculturalOrderItem;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Persistence.Queries;
public class AgriculturalOrderItemQuery : BaseQuery, IAgriculturalOrderItemQuery
{
    private readonly ICurrentUserService _user;
    public AgriculturalOrderItemQuery(IDbConnectionFactory factory, ICurrentUserService user) : base(factory) { _user = user; }

    private const string Projection = """
to_jsonb(t) || jsonb_build_object('AgriculturalProductCode', COALESCE(NULLIF(t."ProductCodeSnapshot",''),p."Code"), 'ProductName', COALESCE(NULLIF(t."ProductNameSnapshot",''),p."Name"), 'ProductSlug', COALESCE(NULLIF(t."ProductSlugSnapshot",''),p."Slug"), 'LineTotal', t."Quantity"*t."Price")
""";
    private const string From = """
FROM "AgriculturalOrderItems" t JOIN "AgriculturalOrders" o ON o."AgriculturalOrderId"=t."AgriculturalOrderId" LEFT JOIN "Checkouts" c ON c."CheckoutId"=o."CheckoutId" LEFT JOIN "Farms" f ON f."FarmId"=o."FarmId" LEFT JOIN "AgriculturalProducts" p ON p."AgriculturalProductId"=t."AgriculturalProductId"
""";
    private QueryFilter Filter()
    {
        var id = QueryAccess.UserId(_user); var where = new QueryFilter(); where.Add("NOT o.\"IsDeleted\"");
        if (!QueryAccess.IsManager(_user)) where.Add("(o.\"BuyerId\"=@Id OR ((o.\"IsPaid\" OR o.\"IsHeld\" OR c.\"IsSubmitted\") AND f.\"OwnerId\"=@Id))", "Id", id);
        return where;
    }
    public Task<AgriculturalOrderItemDto?> GetByCodeAsync(string code)
    { var where = Filter(); where.Add("t.\"Code\"=@Code", "Code", code); return QueryJsonFirstAsync<AgriculturalOrderItemDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters); }
    public Task<PagedResult<AgriculturalOrderItemDto>> GetByFilterAsync(AgriculturalOrderItemFilterDto filter)
    {
        if (string.IsNullOrWhiteSpace(filter.OrderCode)) throw new BadRequestException("کد سفارش الزامی است.");
        var where = Filter(); where.Equal("o.\"Code\"", "Order", filter.OrderCode);
        where.Equal("COALESCE(NULLIF(t.\"ProductCodeSnapshot\",''),p.\"Code\")", "Product", filter.ProductCode);
        where.Compare("t.\"Quantity\"", ">=", "MinQuantity", filter.MinQuantity); where.Compare("t.\"Quantity\"", "<=", "MaxQuantity", filter.MaxQuantity);
        where.Compare("t.\"Price\"", ">=", "MinPrice", filter.MinPrice); where.Compare("t.\"Price\"", "<=", "MaxPrice", filter.MaxPrice);
        return QueryJsonPagedAsync<AgriculturalOrderItemDto>(Projection, From, where, "t.\"AgriculturalOrderItemId\"", filter.PageNumber, filter.PageSize);
    }
}
