using AlooGiyah_Application.DTOs.StatusChangeLog;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
namespace AlooGiyah_Persistence.Queries;
public class StatusChangeLogQuery : BaseQuery, IStatusChangeLogQuery
{
    private readonly ICurrentUserService _currentUser;
    public StatusChangeLogQuery(IDbConnectionFactory factory, ICurrentUserService currentUser) : base(factory)
    { _currentUser = currentUser; }
    private const string Projection = """
to_jsonb(t) || jsonb_build_object('UserCode', u."Code", 'OldStatusCode', o."Code", 'NewStatusCode', n."Code")
""";
    private const string From = """
FROM "StatusChangeLogs" t LEFT JOIN "Users" u ON u."UserId" = t."UserId" LEFT JOIN "Statuses" o ON o."StatusId" = t."OldStatusId" LEFT JOIN "Statuses" n ON n."StatusId" = t."NewStatusId"
""";
    private QueryFilter BaseFilter()
    {
        var where = new QueryFilter();
        QueryAccess.Owner(where, _currentUser, """
t."UserId"
""");
        
        return where;
    }
    public Task<StatusChangeLogDto?> GetByCodeAsync(string code)
    {
        var where = BaseFilter(); where.Add("t.\"Code\" = @Code", "Code", code);
        return QueryJsonFirstAsync<StatusChangeLogDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters);
    }
    public Task<PagedResult<StatusChangeLogDto>> GetByFilterAsync(StatusChangeLogFilterDto filter)
    {
        var where = BaseFilter();
        where.Equal("""
u."Code"
""", "UserCode", filter.UserCode);
        where.Equal("""
t."EntityId"
""", "EntityId", filter.EntityId);
        where.Equal("""
t."EntityStatus"
""", "EntityStatus", filter.EntityStatus);
        if (!string.IsNullOrWhiteSpace(filter.StatusCode)) where.Add("""
(o."Code" = @StatusCode OR n."Code" = @StatusCode)
""", "StatusCode", filter.StatusCode);
        where.Compare("""
t."ChangeDate"
""", ">=", "StartDate", filter.StartDate);
        where.Compare("""
t."ChangeDate"
""", "<=", "EndDate", filter.EndDate);
        return QueryJsonPagedAsync<StatusChangeLogDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"StatusChangeLogId\" DESC", filter.PageNumber, filter.PageSize);
    }
}
