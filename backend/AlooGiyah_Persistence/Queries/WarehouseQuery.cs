using AlooGiyah_Application.DTOs.Warehouse;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
namespace AlooGiyah_Persistence.Queries;
public class WarehouseQuery : BaseQuery, IWarehouseQuery
{
    private readonly ICurrentUserService _currentUser;
    public WarehouseQuery(IDbConnectionFactory factory, ICurrentUserService currentUser) : base(factory)
    { _currentUser = currentUser; }
    private const string Projection = """
to_jsonb(t) || jsonb_build_object('FarmerCode', u."Code")
""";
    private const string From = """
FROM "Warehouses" t LEFT JOIN "Users" u ON u."UserId" = t."FarmerId"
""";
    private QueryFilter BaseFilter()
    {
        var where = new QueryFilter();
        QueryAccess.Owner(where, _currentUser, """
t."FarmerId"
""");
        
        return where;
    }
    public Task<WarehouseDto?> GetByCodeAsync(string code)
    {
        var where = BaseFilter(); where.Add("t.\"Code\" = @Code", "Code", code);
        return QueryJsonFirstAsync<WarehouseDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters);
    }
    public Task<PagedResult<WarehouseDto>> GetByFilterAsync(WarehouseFilterDto filter)
    {
        var where = BaseFilter();
        where.Contains("""
t."Name"
""", "Name", filter.Name);
        where.Equal("""
u."Code"
""", "FarmerCode", filter.FarmerCode);
        return QueryJsonPagedAsync<WarehouseDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"WarehouseId\" DESC", filter.PageNumber, filter.PageSize);
    }
}
