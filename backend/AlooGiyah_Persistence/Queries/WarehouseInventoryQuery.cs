using AlooGiyah_Application.DTOs.WarehouseInventory;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
namespace AlooGiyah_Persistence.Queries;
public class WarehouseInventoryQuery : BaseQuery, IWarehouseInventoryQuery
{
    private readonly ICurrentUserService _currentUser;
    public WarehouseInventoryQuery(IDbConnectionFactory factory, ICurrentUserService currentUser) : base(factory)
    { _currentUser = currentUser; }
    private const string Projection = """
to_jsonb(t) || jsonb_build_object('WarehouseCode', w."Code", 'EntityCode', COALESCE(p."Code", ''))
""";
    private const string From = """
FROM "WarehouseInventories" t LEFT JOIN "Warehouses" w ON w."WarehouseId" = t."WarehouseId" LEFT JOIN "AgriculturalProducts" p ON p."AgriculturalProductId" = t."EntityId" AND t."EntityWarehouse" = 0
""";
    private QueryFilter BaseFilter()
    {
        var where = new QueryFilter();
        QueryAccess.Owner(where, _currentUser, """
w."FarmerId"
""");
        
        return where;
    }
    public Task<WarehouseInventoryDto?> GetByCodeAsync(string code)
    {
        var where = BaseFilter(); where.Add("t.\"Code\" = @Code", "Code", code);
        return QueryJsonFirstAsync<WarehouseInventoryDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters);
    }
    public Task<PagedResult<WarehouseInventoryDto>> GetByFilterAsync(WarehouseInventoryFilterDto filter)
    {
        var where = BaseFilter();
        where.Equal("""
w."Code"
""", "WarehouseCode", filter.WarehouseCode);
        where.Equal("""
p."Code"
""", "EntityCode", filter.EntityCode);
        where.Equal("""
t."EntityWarehouse"
""", "EntityWarehouse", filter.EntityWarehouse);
        where.Compare("""
t."Quantity"
""", ">=", "MinQuantity", filter.MinQuantity);
        where.Compare("""
t."Quantity"
""", "<=", "MaxQuantity", filter.MaxQuantity);
        where.Compare("""
t."LastRestockDate"
""", ">=", "LastRestockFrom", filter.LastRestockFrom);
        where.Compare("""
t."LastRestockDate"
""", "<=", "LastRestockTo", filter.LastRestockTo);
        return QueryJsonPagedAsync<WarehouseInventoryDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"WarehouseInventoryId\" DESC", filter.PageNumber, filter.PageSize);
    }
}
