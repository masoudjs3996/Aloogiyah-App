using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Threading.RateLimiting;
using AlooGiyah_Application.Commons;

namespace AlooGiyah_Api.RateLimiting;

// Reject IP floods before JWT validation and its database lookup.
public sealed class IpTrafficMiddleware : IMiddleware, IDisposable
{
    private readonly PartitionedRateLimiter<HttpContext> limiter;
    private readonly ILogger<IpTrafficMiddleware> logger;
    public IpTrafficMiddleware(IConfiguration configuration, ILogger<IpTrafficMiddleware> logger)
    {
        this.logger = logger;
        limiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions {
                    PermitLimit = configuration.GetValue("TrafficLimits:IpPerMinute", 1200),
                    Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
    }
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        using var lease = await limiter.AcquireAsync(context, 1, context.RequestAborted);
        if (lease.IsAcquired) { await next(context); return; }
        var seconds = lease.TryGetMetadata(MetadataName.RetryAfter, out var delay) ? Math.Max(1, (int)Math.Ceiling(delay.TotalSeconds)) : 60;
        context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.Response.Headers.RetryAfter = seconds.ToString(System.Globalization.CultureInfo.InvariantCulture);
        context.Response.Headers.CacheControl = "no-store";
        logger.LogWarning("IP rate limit rejected request at {Path}; retry after {Seconds}s", context.Request.Path, seconds);
        await context.Response.WriteAsJsonAsync(new ApiResponse<object>(
            "تعداد درخواست‌ها زیاد است. لطفاً کمی صبر کنید و دوباره تلاش کنید.", "RATE_LIMITED"), context.RequestAborted);
    }
    public void Dispose() => limiter.Dispose();
}
