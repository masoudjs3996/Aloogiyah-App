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
to_jsonb(t) || jsonb_build_object(
    'ConversationCode', c."Code", 'SenderCode', u."Code", 'ReceiverCode', r."Code",
    'SenderName', COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', u."FName", u."LName")), ''), u."UserName"),
    'ReceiverName', COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', r."FName", r."LName")), ''), r."UserName"),
    'SenderFarmName', (SELECT f."Name" FROM "Farms" f WHERE f."OwnerId"=u."UserId" AND NOT f."IsDeleted" ORDER BY f."CreatedAt" DESC LIMIT 1),
    'ReceiverFarmName', (SELECT f."Name" FROM "Farms" f WHERE f."OwnerId"=r."UserId" AND NOT f."IsDeleted" ORDER BY f."CreatedAt" DESC LIMIT 1),
    'SenderProductName', (SELECT p."Name" FROM "AgriculturalProducts" p JOIN "Farms" f ON f."FarmId"=p."FarmId" WHERE f."OwnerId"=u."UserId" AND NOT f."IsDeleted" AND NOT p."IsDeleted" ORDER BY p."CreatedAt" DESC LIMIT 1),
    'ReceiverProductName', (SELECT p."Name" FROM "AgriculturalProducts" p JOIN "Farms" f ON f."FarmId"=p."FarmId" WHERE f."OwnerId"=r."UserId" AND NOT f."IsDeleted" AND NOT p."IsDeleted" ORDER BY p."CreatedAt" DESC LIMIT 1)
)
""";
    private const string From = """
FROM "ChatMessages" t LEFT JOIN "Users" u ON u."UserId" = t."SenderId" LEFT JOIN "Users" r ON r."UserId" = t."ReceiverId" LEFT JOIN "ChatConversations" c ON c."ChatConversationId"=t."ConversationId"
""";
    private QueryFilter BaseFilter()
    {
        var where = new QueryFilter();
        var currentUserId = QueryAccess.UserId(_currentUser);
        where.Add("(t.\"SenderId\" = @CurrentUserId OR t.\"ReceiverId\" = @CurrentUserId)", "CurrentUserId", currentUserId);
        where.Add("NOT t.\"IsDeleted\"");
        
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
    public Task<PagedResult<ChatMessageDto>> GetConversationAsync(string conversationCode, int pageNumber, int pageSize)
    {
        var where = BaseFilter();
        where.Add("c.\"Code\"=@ConversationCode", "ConversationCode", conversationCode);
        return QueryJsonPagedAsync<ChatMessageDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"ChatMessageId\" DESC", pageNumber, pageSize);
    }

    public Task<ChatContactDto?> GetContactAsync(string code)
    {
        var currentUserId = QueryAccess.UserId(_currentUser);
        const string from = "FROM \"Users\" u JOIN \"Roles\" role ON role.\"RoleId\"=u.\"RoleId\"";
        const string projection = """
jsonb_build_object(
    'Code', u."Code",
    'DisplayName', COALESCE(NULLIF(BTRIM(CONCAT_WS(' ',u."FName",u."LName")), ''), u."UserName"),
    'FarmName', (SELECT f."Name" FROM "Farms" f WHERE f."OwnerId"=u."UserId" AND NOT f."IsDeleted" ORDER BY f."CreatedAt" DESC LIMIT 1),
    'ProductName', (SELECT p."Name" FROM "AgriculturalProducts" p JOIN "Farms" f ON f."FarmId"=p."FarmId" WHERE f."OwnerId"=u."UserId" AND NOT f."IsDeleted" AND NOT p."IsDeleted" ORDER BY p."CreatedAt" DESC LIMIT 1)
)
""";
        return QueryJsonFirstAsync<ChatContactDto>($"SELECT ({projection})::text {from} WHERE u.\"Code\"=@Code AND u.\"UserId\"<>@CurrentUserId AND NOT u.\"IsDeleted\" AND role.\"Name\"<>'Guest'", new { Code = code, CurrentUserId = currentUserId });
    }

    public Task<List<ChatConversationSummaryDto>> GetConversationsAsync()
    {
        var currentUserId = QueryAccess.UserId(_currentUser);
        const string sql = """
SELECT jsonb_build_object(
    'Code', c."Code",
    'PeerCode', peer."Code",
    'PeerName', COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', peer."FName", peer."LName")), ''), peer."UserName"),
    'FarmName', (SELECT f."Name" FROM "Farms" f WHERE f."OwnerId"=peer."UserId" AND NOT f."IsDeleted" ORDER BY f."CreatedAt" DESC LIMIT 1),
    'ProductName', (SELECT p."Name" FROM "AgriculturalProducts" p JOIN "Farms" f ON f."FarmId"=p."FarmId" WHERE f."OwnerId"=peer."UserId" AND NOT f."IsDeleted" AND NOT p."IsDeleted" ORDER BY p."CreatedAt" DESC LIMIT 1),
    'LastMessage', COALESCE(latest."Message", ''),
    'LastMessageAt', COALESCE(latest."CreatedAt", c."LastMessageAt", c."CreatedAt"),
    'UnreadCount', (SELECT COUNT(*)::integer FROM "ChatMessages" unread WHERE unread."ConversationId"=c."ChatConversationId" AND unread."ReceiverId"=@CurrentUserId AND NOT unread."IsRead" AND NOT unread."IsDeleted")
)
FROM "ChatConversations" c
JOIN "Users" peer ON peer."UserId"=CASE WHEN c."ParticipantOneId"=@CurrentUserId THEN c."ParticipantTwoId" ELSE c."ParticipantOneId" END
LEFT JOIN LATERAL (
    SELECT message."Message", message."CreatedAt"
    FROM "ChatMessages" message
    WHERE message."ConversationId"=c."ChatConversationId" AND NOT message."IsDeleted"
    ORDER BY message."CreatedAt" DESC, message."ChatMessageId" DESC
    LIMIT 1
) latest ON true
WHERE (c."ParticipantOneId"=@CurrentUserId OR c."ParticipantTwoId"=@CurrentUserId)
  AND NOT c."IsDeleted" AND NOT peer."IsDeleted"
ORDER BY COALESCE(latest."CreatedAt", c."LastMessageAt", c."CreatedAt") DESC
""";
        return QueryJsonAsync<ChatConversationSummaryDto>(sql, new { CurrentUserId = currentUserId });
    }
}
