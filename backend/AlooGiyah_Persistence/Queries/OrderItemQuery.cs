using AlooGiyah_Application.DTOs.OrderItem;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
namespace AlooGiyah_Persistence.Queries;
public class OrderItemQuery : BaseQuery, IOrderItemQuery
{
    private readonly ICurrentUserService _currentUser;
    public OrderItemQuery(IDbConnectionFactory factory, ICurrentUserService currentUser) : base(factory)
    { _currentUser = currentUser; }
    private const string Projection = """
to_jsonb(t) || jsonb_build_object('OrderItemCode', t."Code", 'ProductCode', p."Code", 'ProductName', p."Name", 'OrderCode', o."Code")
""";
    private const string From = """
FROM "OrderItems" t LEFT JOIN "Products" p ON p."ProductId" = t."ProductId" LEFT JOIN "Orders" o ON o."OrderId" = t."OrderId"
""";
    private QueryFilter BaseFilter()
    {
        var where = new QueryFilter();
        QueryAccess.Owner(where, _currentUser, """
o."UserId"
""");
        
        return where;
    }
    public Task<OrderItemDto?> GetByCodeAsync(string code)
    {
        var where = BaseFilter(); where.Add("t.\"Code\" = @Code", "Code", code);
        return QueryJsonFirstAsync<OrderItemDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters);
    }
    public Task<PagedResult<OrderItemDto>> GetByFilterAsync(OrderItemFilterDto filter)
    {
        var where = BaseFilter();
        where.Equal("""
o."Code"
""", "OrderCode", filter.OrderCode);
        where.Equal("""
p."Code"
""", "ProductCode", filter.ProductCode);
        where.Contains("""
p."Name"
""", "SearchTerm", filter.SearchTerm);
        return QueryJsonPagedAsync<OrderItemDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"OrderItemId\" DESC", filter.PageNumber, filter.PageSize);
    }
}
