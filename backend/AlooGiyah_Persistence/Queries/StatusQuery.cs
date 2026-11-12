using AlooGiyah_Application.DTOs.Status;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
namespace AlooGiyah_Persistence.Queries;
public class StatusQuery : BaseQuery, IStatusQuery
{
    private readonly ICurrentUserService _currentUser;
    public StatusQuery(IDbConnectionFactory factory, ICurrentUserService currentUser) : base(factory)
    { _currentUser = currentUser; }
    private const string Projection = """
to_jsonb(t)
""";
    private const string From = """
FROM "Statuses" t 
""";
    private QueryFilter BaseFilter()
    {
        var where = new QueryFilter();
        
        
        return where;
    }
    public Task<StatusDto?> GetByCodeAsync(string code)
    {
        var where = BaseFilter(); where.Add("t.\"Code\" = @Code", "Code", code);
        return QueryJsonFirstAsync<StatusDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters);
    }
    public Task<PagedResult<StatusDto>> GetByFilterAsync(StatusFilterDto filter)
    {
        var where = BaseFilter();
        where.Contains("""
t."Name"
""", "Name", filter.Name);
        where.Equal("""
t."EntityStatus"
""", "EntityStatus", filter.EntityStatus);
        return QueryJsonPagedAsync<StatusDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"StatusId\" DESC", filter.PageNumber, filter.PageSize);
    }
}
