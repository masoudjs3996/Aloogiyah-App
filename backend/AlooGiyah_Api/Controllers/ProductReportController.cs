using System.ComponentModel.DataAnnotations;
using AlooGiyah_Application.Commons;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Api.Controllers;

[ApiController, Route("api/ProductReport"), Authorize(Policy = "NotGuest")]
public sealed class ProductReportController(AlooGiyahDbContext db, ICurrentUserService actor) : ControllerBase
{
    public sealed record ReportInput([Required, StringLength(1000)] string Reason);

    [HttpPost("{productCode}"), EnableRateLimiting("product-report")]
    public async Task<IActionResult> Create(string productCode, ReportInput input, CancellationToken ct)
    {
        if (!int.TryParse(actor.UserId, out var userId)) return Unauthorized();
        var reason = input.Reason?.Trim() ?? "";
        if (reason.Length < 5) return BadRequest(new { message = "دلیل گزارش را در حداقل ۵ نویسه بنویسید." });

        var product = await db.AgriculturalListings.AsNoTracking()
            .Where(p => (p.Code == productCode || p.LegacyProductCode == productCode) && !p.IsDeleted && !p.Farm.IsDeleted && p.IsPublished)
            .Select(p => new { p.AgriculturalListingId, p.Farm.OwnerId })
            .SingleOrDefaultAsync(ct);
        if (product is null) return NotFound(new { message = "محصول پیدا نشد." });
        if (product.OwnerId == userId) return BadRequest(new { message = "امکان گزارش محصول خودتان وجود ندارد." });

        var inserted = await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "ProductReports" ("ProductId", "ReporterId", "Reason", "CreatedAt")
            VALUES ({product.AgriculturalListingId}, {userId}, {reason}, {DateTimeOffset.UtcNow})
            ON CONFLICT ("ReporterId", "ProductId") WHERE "ReviewedAt" IS NULL DO NOTHING
            """, ct);
        return Success(new { AlreadyPending = inserted == 0 });
    }

    [HttpGet, Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> List(bool reviewed = false, int page = 1, CancellationToken ct = default)
    {
        const int pageSize = 20;
        page = Math.Clamp(page, 1, int.MaxValue / pageSize);
        var reports = db.ProductReports.AsNoTracking().Where(x => (x.ReviewedAt != null) == reviewed);
        var totalCount = await reports.CountAsync(ct);
        var items = await reports.OrderByDescending(x => x.Id).Skip((page - 1) * pageSize).Take(pageSize)
            .Join(db.AgriculturalListings.IgnoreQueryFilters(), report => report.ProductId, product => product.AgriculturalListingId,
                (report, product) => new { report.Id, report.Reason, report.CreatedAt, report.ReviewedAt,
                    ProductCode = product.Code, ProductName = product.Name, ProductRemoved = product.IsDeleted })
            .OrderByDescending(x => x.Id).ToListAsync(ct);
        return Success(new { Items = items, TotalCount = totalCount, PageSize = pageSize });
    }

    [HttpPatch("{id:int}/Review"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Review(int id, [FromQuery] bool removeListing, CancellationToken ct)
    {
        if (!int.TryParse(actor.UserId, out var userId)) return Unauthorized();
        var now = DateTimeOffset.UtcNow;
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var updated = await db.ProductReports.Where(x => x.Id == id && x.ReviewedAt == null)
            .ExecuteUpdateAsync(x => x.SetProperty(r => r.ReviewedAt, now).SetProperty(r => r.ReviewedById, userId), ct);
        if (updated == 0 && !await db.ProductReports.AnyAsync(x => x.Id == id, ct))
            return NotFound(new { message = "گزارش پیدا نشد." });
        if (updated > 0 && removeListing)
            await db.AgriculturalListings.Where(x => !x.IsDeleted && db.ProductReports.Any(report => report.Id == id && report.ProductId == x.AgriculturalListingId))
                .ExecuteUpdateAsync(set => set.SetProperty(x => x.IsDeleted, true).SetProperty(x => x.IsPublished, false).SetProperty(x => x.UpdatedAt, now), ct);
        await transaction.CommitAsync(ct);
        return Success(true);
    }

    private IActionResult Success<T>(T data) => Ok(new ApiResponse<T> { IsSuccess = true, Data = data });
}
