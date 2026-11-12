using AlooGiyah_Api.Maps;
using AlooGiyah_Application.Commons;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AlooGiyah_Api.Controllers;

[ApiController, Route("api/Map"), AllowAnonymous]
public class MapController(MapSearchService maps) : ControllerBase
{
    [HttpGet("Config")]
    public IActionResult Config() => Ok(new ApiResponse<MapSettings> { IsSuccess = true, Data = maps.Settings });

    [HttpGet("Search"), EnableRateLimiting("map-search")]
    public async Task<IActionResult> Search([FromQuery] string q, CancellationToken cancellationToken)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(TimeSpan.FromSeconds(20));
        try { return Ok(new ApiResponse<IReadOnlyList<MapPlace>> { IsSuccess = true, Data = await maps.SearchAsync(q, timeout.Token) }); }
        catch (ArgumentException error) { return BadRequest(new { message = error.Message }); }
        catch (OperationCanceledException) { return StatusCode(503, new { message = "جست‌وجو شلوغ است؛ کمی بعد دوباره تلاش کنید." }); }
        catch (HttpRequestException error) { return StatusCode(503, new { message = error.Message }); }
        catch (InvalidOperationException error) { return StatusCode(503, new { message = error.Message }); }
    }
}
