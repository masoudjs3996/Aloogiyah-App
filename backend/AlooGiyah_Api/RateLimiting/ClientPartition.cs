using Microsoft.AspNetCore.Http;
namespace AlooGiyah_Api.RateLimiting;
public static class ClientPartition
{
    public static string Key(HttpContext context) =>
        context.User.Identity?.IsAuthenticated == true && !context.User.IsInRole("Guest") &&
                !string.IsNullOrWhiteSpace(context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value)
                ? "user:" + context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value
                : "ip:" + (context.Connection.RemoteIpAddress?.ToString() ?? "unknown");
}
