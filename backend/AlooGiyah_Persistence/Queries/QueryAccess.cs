using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Persistence.Queries;
internal static class QueryAccess
{
    public static int UserId(ICurrentUserService user)
    {
        if (!user.IsAuthenticated || user.IsGuest || !int.TryParse(user.UserId, out var id))
            throw new UnauthorizedException("ابتدا وارد حساب کاربری شوید.");
        return id;
    }
    public static bool IsManager(ICurrentUserService user) => user.Roles.Contains("Manager") || user.Roles.Contains("Admin");
    public static void Owner(QueryFilter filter, ICurrentUserService user, string column)
    { if (!IsManager(user)) filter.Add(column + " = @CurrentUserId", "CurrentUserId", UserId(user)); }
}
