using Microsoft.AspNetCore.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AlooGiyah_Api.Caching;

// Only catalogue reads enter this bounded cache. Authentication/authorization run first.
public sealed class CatalogCacheFilter(IOptions<JsonOptions> json) : IAsyncActionFilter, IDisposable
{
    private readonly MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 32 * 1024 * 1024 });
    private readonly SemaphoreSlim[] locks = Enumerable.Range(0, 64).Select(_ => new SemaphoreSlim(1)).ToArray();
    private long generation;
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var request = context.HttpContext.Request;
        var controller = context.RouteData.Values["controller"]?.ToString();
        var category = controller == "Category";
        var product = controller == "AgriculturalProduct";
        if (!category && !product) { await next(); return; }
        if (!HttpMethods.IsGet(request.Method))
        {
            var executed = await next();
            if (executed.Exception == null && (context.HttpContext.Response.StatusCode < 400) &&
                executed.Result is ObjectResult { StatusCode: null or >= 200 and < 300 })
            { Interlocked.Increment(ref generation); cache.Compact(1); }
            return;
        }
        var paths = category ? new[] { "GetByFilter", "GetByCode", "GetCategoriesByType", "CategoryTree" }
            : new[] { "GetByFilter", "GetByCode", "GetSimilar" };
        if (!paths.Contains(request.Path.Value?.Split('/').Last(), StringComparer.OrdinalIgnoreCase)) { await next(); return; }
        // Route and field availability can change outside the product controller.
        if (product && (request.Query.ContainsKey("DeliveryPointCode") || request.Query.ContainsKey("DestinationPointCode")))
        { context.HttpContext.Response.Headers.CacheControl = "no-store"; await next(); return; }
        if (request.QueryString.Value?.Length > 2048) { await next(); return; }
        var user = context.HttpContext.User;
        var actor = user.Identity?.IsAuthenticated == true
            ? string.Join("|", user.Claims.Select(c => c.Type + "=" + c.Value)) : "anonymous";
        var version = Interlocked.Read(ref generation);
        var source = $"{version}:{request.Path}:{request.QueryString}:{actor}";
        var key = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(source)));
        var gate = locks[(int)(Convert.ToUInt32(key[..8], 16) % 64)];
        await gate.WaitAsync(context.HttpContext.RequestAborted);
        try
        {
            if (cache.TryGetValue(key, out string? body))
            { SetHeaders(context, category); context.Result = new ContentResult { Content = body, ContentType = "application/json; charset=utf-8", StatusCode = 200 }; return; }
            var result = await next();
            if (result.Exception != null || result.Result is not ObjectResult { StatusCode: null or 200 } value || value.Value == null) return;
            body = JsonSerializer.Serialize(value.Value, json.Value.JsonSerializerOptions);
            var size = Encoding.UTF8.GetByteCount(body);
            if (size <= 1024 * 1024 && version == Interlocked.Read(ref generation))
                cache.Set(key, body, new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(category ? 86400 : 60), Size = size });
            SetHeaders(context, category);
        }
        finally { gate.Release(); }
    }
    private static void SetHeaders(ActionExecutingContext context, bool category)
    {
        context.HttpContext.Response.Headers.CacheControl = $"private, max-age={(category ? 86400 : 180)}";
        context.HttpContext.Response.Headers.Vary = "Authorization, Cookie";
    }
    public void Dispose() { cache.Dispose(); foreach (var gate in locks) gate.Dispose(); }
}
