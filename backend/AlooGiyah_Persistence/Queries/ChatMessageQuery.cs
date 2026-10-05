using AlooGiyah_Application.DTOs.ChatMessage;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
namespace AlooGiyah_Persistence.Queries;
public class ChatMessageQuery : BaseQuery, IChatMessageQuery
{
    private readonly ICurrentUserService _currentUser;
    public ChatMessageQuery(IDbConnectionFactory factory, ICurrentUserService currentUser) : base(factory)
    { _currentUser = currentUser; }
    private const string Projection = """
to_jsonb(t) || jsonb_build_object('SenderCode', u."Code", 'ReceiverCode', r."Code")
""";
    private const string From = """
FROM "ChatMessages" t LEFT JOIN "Users" u ON u."UserId" = t."SenderId" LEFT JOIN "Users" r ON r."UserId" = t."ReceiverId"
""";
    private QueryFilter BaseFilter()
    {
        var where = new QueryFilter();
        QueryAccess.UserId(_currentUser);
        if (!QueryAccess.IsManager(_currentUser)) where.Add("(t.\"SenderId\" = @CurrentUserId OR t.\"ReceiverId\" = @CurrentUserId)", "CurrentUserId", QueryAccess.UserId(_currentUser));
        
        return where;
    }
    public Task<ChatMessageDto?> GetByCodeAsync(string code)
    {
        var where = BaseFilter(); where.Add("t.\"Code\" = @Code", "Code", code);
        return QueryJsonFirstAsync<ChatMessageDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters);
    }
    public Task<PagedResult<ChatMessageDto>> GetByFilterAsync(ChatMessageFilterDto filter)
    {
        var where = BaseFilter();
        where.Equal("""
u."Code"
""", "SenderCode", filter.SenderCode);
        where.Equal("""
r."Code"
""", "ReceiverCode", filter.ReceiverCode);
        where.Equal("""
t."IsRead"
""", "IsRead", filter.IsRead);
        where.Compare("""
t."CreatedAt"
""", ">=", "StartDate", filter.StartDate);
        where.Compare("""
t."CreatedAt"
""", "<=", "EndDate", filter.EndDate);
        return QueryJsonPagedAsync<ChatMessageDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"ChatMessageId\" DESC", filter.PageNumber, filter.PageSize);
    }
    public Task<PagedResult<ChatMessageDto>> GetConversationAsync(string userCode1, string userCode2, int pageNumber, int pageSize)
    {
        var where = BaseFilter();
        where.Add("((u.\"Code\"=@First AND r.\"Code\"=@Second) OR (u.\"Code\"=@Second AND r.\"Code\"=@First))");
        where.Parameters.Add("First", userCode1); where.Parameters.Add("Second", userCode2);
        return QueryJsonPagedAsync<ChatMessageDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"ChatMessageId\" DESC", pageNumber, pageSize);
    }
}
