using System.ComponentModel.DataAnnotations;
using AlooGiyah_Application.Commons;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Api.Controllers;

[ApiController, Route("api/Push"), Authorize(Policy = "NotGuest"), EnableRateLimiting("chat-send")]
public sealed class PushController(AlooGiyahDbContext db, ICurrentUserService actor, IConfiguration configuration) : ControllerBase
{
    public sealed class DeviceInput
    {
        [Required, StringLength(256), RegularExpression(@"^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$")]
        public string Token { get; set; } = "";
    }
    [HttpPost("Register")]
    public async Task<IActionResult> Register(DeviceInput input, CancellationToken cancellationToken)
    {
        if (!int.TryParse(actor.UserId, out var userId)) return Unauthorized();
        var now = DateTimeOffset.UtcNow;
        // The same physical installation can belong to only its most recently signed-in account.
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "PushRegistrations" ("Token", "UserId", "UpdatedAt", "ExpiresAt")
            VALUES ({input.Token}, {userId}, {now}, {now.AddDays(30)})
            ON CONFLICT ("Token") DO UPDATE SET "UserId"=EXCLUDED."UserId", "UpdatedAt"=EXCLUDED."UpdatedAt", "ExpiresAt"=EXCLUDED."ExpiresAt"
            """, cancellationToken);
        return Ok(new ApiResponse<object> { IsSuccess = true, Data = new { enabled = configuration.GetValue<bool>("Push:Enabled") } });
    }
    [HttpPost("Unregister")]
    public async Task<IActionResult> Unregister(DeviceInput input, CancellationToken cancellationToken)
    {
        if (!int.TryParse(actor.UserId, out var userId)) return Unauthorized();
        await db.PushRegistrations.Where(x => x.Token == input.Token && x.UserId == userId).ExecuteDeleteAsync(cancellationToken);
        return Ok(new ApiResponse<bool> { IsSuccess = true, Data = true });
    }
}
