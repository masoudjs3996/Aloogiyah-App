using System.ComponentModel.DataAnnotations;
using AlooGiyah_Application.Commons;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Api.Controllers;

[ApiController, Route("api/ChatReport"), Authorize(Policy = "NotGuest")]
public sealed class ChatReportController(AlooGiyahDbContext db, ICurrentUserService actor, IChatFileStorage storage) : ControllerBase
{
    public sealed record ReportInput([Required, StringLength(1000)] string Reason);

    [HttpPost("{messageCode}"), EnableRateLimiting("product-report")]
    public async Task<IActionResult> Create(string messageCode, ReportInput input, CancellationToken ct)
    {
        if (!int.TryParse(actor.UserId, out var id)) return Unauthorized();
        var reason = input.Reason.Trim();
        if (reason.Length < 5) return BadRequest(new { message = "دلیل گزارش را در حداقل ۵ نویسه بنویسید." });
        var message = await db.ChatMessages.AsNoTracking()
            .Where(x => x.Code == messageCode && x.ReceiverId == id && !x.IsDeleted)
            .Select(x => new { x.ChatMessageId, x.Message }).SingleOrDefaultAsync(ct);
        if (message is null) return NotFound(new { message = "پیام قابل گزارش پیدا نشد." });
        var inserted = await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "ChatMessageReports" ("MessageId", "ReporterId", "Reason", "MessageText", "CreatedAt")
            VALUES ({message.ChatMessageId}, {id}, {reason}, {message.Message}, {DateTimeOffset.UtcNow})
            ON CONFLICT ("ReporterId", "MessageId") WHERE "ReviewedAt" IS NULL DO NOTHING
            """, ct);
        return Success(new { AlreadyPending = inserted == 0 });
    }

    [HttpGet, Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> List(bool reviewed = false, int page = 1, CancellationToken ct = default)
    {
        const int pageSize = 20;
        page = Math.Clamp(page, 1, int.MaxValue / pageSize);
        var reports = db.ChatMessageReports.AsNoTracking().Where(x => (x.ReviewedAt != null) == reviewed);
        var totalCount = await reports.CountAsync(ct);
        var items = await reports.OrderByDescending(x => x.Id).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new { x.Id, x.Reason, x.CreatedAt, x.ReviewedAt, x.MessageText,
                MessageCode = x.Message.Code, SenderCode = x.Message.Sender.Code,
                x.Message.AttachmentName, MessageRemoved = x.Message.IsDeleted }).ToListAsync(ct);
        return Success(new { Items = items, TotalCount = totalCount, PageSize = pageSize });
    }

    [HttpGet("{id:int}/Attachment"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Attachment(int id, CancellationToken ct)
    {
        var file = await db.ChatMessageReports.AsNoTracking().Where(x => x.Id == id && x.Message.AttachmentKey != null)
            .Select(x => new { x.Message.AttachmentKey, x.Message.AttachmentName }).SingleOrDefaultAsync(ct);
        if (file is null) return NotFound();
        Response.Headers.CacheControl = "no-store";
        try { return File(storage.Open(file.AttachmentKey!), "application/octet-stream", file.AttachmentName ?? "attachment"); }
        catch (FileNotFoundException) { return NotFound(); }
    }

    [HttpPatch("{id:int}/Review"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Review(int id, [FromQuery] bool removeMessage, CancellationToken ct)
    {
        if (!int.TryParse(actor.UserId, out var reviewer)) return Unauthorized();
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var report = await db.ChatMessageReports.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct);
        if (report is null) return NotFound(new { message = "گزارش پیدا نشد." });
        var now = DateTimeOffset.UtcNow;
        var reviewed = await db.ChatMessageReports.Where(x => x.Id == id && x.ReviewedAt == null)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.ReviewedAt, now).SetProperty(x => x.ReviewedById, reviewer), ct);
        if (reviewed > 0 && removeMessage)
            await db.ChatMessages.Where(x => x.ChatMessageId == report.MessageId && !x.IsDeleted)
                .ExecuteUpdateAsync(set => set.SetProperty(x => x.IsDeleted, true).SetProperty(x => x.UpdatedAt, now), ct);
        await transaction.CommitAsync(ct);
        return Success(true);
    }

    private IActionResult Success<T>(T data) => Ok(new ApiResponse<T> { IsSuccess = true, Data = data });
}
