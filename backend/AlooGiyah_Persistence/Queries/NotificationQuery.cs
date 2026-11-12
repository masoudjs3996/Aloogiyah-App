using AlooGiyah_Application.DTOs.Notification;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Persistence.Queries;
public class NotificationQuery : BaseQuery, INotificationQuery
{
    private readonly ICurrentUserService _user;
    public NotificationQuery(IDbConnectionFactory factory, ICurrentUserService user) : base(factory) { _user = user; }

    private const string Projection = """
to_jsonb(t) || jsonb_build_object('UserCode', u."Code", 'IsPublic', t."IsPublic")
""";
    private const string From = """
FROM "Notifications" t LEFT JOIN "Users" u ON u."UserId"=t."UserId"
""";
    public Task<List<NotificationDto>> GetMyNotificationsAsync()
    {
        if (!_user.IsAuthenticated)
            throw new UnauthorizedException("برای دریافت اعلان‌ها باید توکن معتبر داشته باشید.");

        var where = _user.IsGuest ? "t.\"IsPublic\" = TRUE" : "t.\"UserId\" = @Id";
        var parameters = _user.IsGuest ? null : new { Id = QueryAccess.UserId(_user) };
        return QueryJsonAsync<NotificationDto>(
            $"SELECT ({Projection})::text {From} WHERE NOT t.\"IsDeleted\" AND {where} ORDER BY t.\"CreatedAt\" DESC, t.\"NotificationId\" DESC",
            parameters);
    }

    public Task<NotificationDto?> GetMyNotificationByCodeAsync(string code) => QueryJsonFirstAsync<NotificationDto>($"SELECT ({Projection})::text {From} WHERE NOT t.\"IsDeleted\" AND t.\"UserId\"=@Id AND t.\"Code\"=@Code", new { Id = QueryAccess.UserId(_user), Code = code });
}
