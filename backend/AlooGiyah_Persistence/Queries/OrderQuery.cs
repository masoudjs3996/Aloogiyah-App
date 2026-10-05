using AlooGiyah_Application.DTOs.Order;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
namespace AlooGiyah_Persistence.Queries;
public class OrderQuery : BaseQuery, IOrderQuery
{
    private readonly ICurrentUserService _currentUser;
    public OrderQuery(IDbConnectionFactory factory, ICurrentUserService currentUser) : base(factory)
    { _currentUser = currentUser; }
    private const string Projection = """
to_jsonb(t) || jsonb_build_object('UserCode', u."Code", 'StatusCode', s."Code", 'AddressCode', a."Code", 'DiscountCode', d."Code", 'Items', COALESCE((SELECT jsonb_agg(to_jsonb(i) || jsonb_build_object('OrderItemCode', i."Code", 'ProductCode', p."Code", 'ProductName', p."Name", 'OrderCode', t."Code") ORDER BY i."OrderItemId") FROM "OrderItems" i JOIN "Products" p ON p."ProductId"=i."ProductId" WHERE i."OrderId"=t."OrderId" AND NOT i."IsDeleted"), '[]'::jsonb))
""";
    private const string From = """
FROM "Orders" t LEFT JOIN "Users" u ON u."UserId" = t."UserId" LEFT JOIN "Statuses" s ON s."StatusId" = t."StatusId" LEFT JOIN "Addresses" a ON a."AddressId" = t."AddressId" LEFT JOIN "Discounts" d ON d."DiscountId" = t."DiscountId"
""";
    private QueryFilter BaseFilter()
    {
        var where = new QueryFilter();
        QueryAccess.Owner(where, _currentUser, """
t."UserId"
""");
        
        return where;
    }
    public Task<OrderDto?> GetByCodeAsync(string code)
    {
        var where = BaseFilter(); where.Add("t.\"Code\" = @Code", "Code", code);
        return QueryJsonFirstAsync<OrderDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters);
    }
    public Task<PagedResult<OrderDto>> GetByFilterAsync(OrderFilterDto filter)
    {
        var where = BaseFilter();
        where.Equal("""
u."Code"
""", "UserCode", filter.UserCode);
        where.Equal("""
s."Code"
""", "StatusCode", filter.StatusCode);
        where.Contains("""
t."Code"
""", "SearchTerm", filter.SearchTerm);
        return QueryJsonPagedAsync<OrderDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"OrderId\" DESC", filter.PageNumber, filter.PageSize);
    }
}
