using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System.Threading.RateLimiting;
namespace AlooGiyah_Api.RateLimiting;
public static class GlobalTrafficLimiter {
 public static PartitionedRateLimiter<HttpContext> Create(IConfiguration configuration) =>
 PartitionedRateLimiter.CreateChained(
        PartitionedRateLimiter.Create<HttpContext, string>(context => RateLimitPartition.GetFixedWindowLimiter(
            AlooGiyah_Api.RateLimiting.ClientPartition.Key(context),
            _ => new FixedWindowRateLimiterOptions { PermitLimit = configuration.GetValue("TrafficLimits:AccountPerMinute", 300), Window = TimeSpan.FromMinutes(1), QueueLimit = 0 })),
        PartitionedRateLimiter.Create<HttpContext, string>(context => RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = configuration.GetValue("TrafficLimits:IpPerMinute", 1200), Window = TimeSpan.FromMinutes(1), QueueLimit = 0 })),
        PartitionedRateLimiter.Create<HttpContext, string>(context =>
            HttpMethods.IsGet(context.Request.Method) || HttpMethods.IsHead(context.Request.Method) || HttpMethods.IsOptions(context.Request.Method)
                ? RateLimitPartition.GetNoLimiter<string>("read")
                : RateLimitPartition.GetFixedWindowLimiter(ClientPartition.Key(context),
                    _ => new FixedWindowRateLimiterOptions {
                        PermitLimit = configuration.GetValue("TrafficLimits:WritesPerMinute", 60),
                        Window = TimeSpan.FromMinutes(1), QueueLimit = 0 })));

}
