using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Security.Claims;
using AlooGiyah_Application.Commons;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Api.Controllers;

// Additive integration: uses existing tables, no migration or DI registration.
[ApiController]
[Route("api/Admin")]
[Authorize(Roles = "Admin,Manager")]
public class AdminController(AlooGiyahDbContext db) : ControllerBase
{
    private IActionResult Success<T>(T data) => Ok(new ApiResponse<T> { IsSuccess = true, Message = "عملیات موفق بود", Data = data });

    [HttpGet("Lookups")]
    public async Task<IActionResult> Lookups(CancellationToken cancellationToken)
    {
        var statuses = await db.Statuses.AsNoTracking().Where(x => !x.IsDeleted)
            .OrderBy(x => x.StatusId).Select(x => new { x.Code, x.Name, x.EntityStatus, x.StatusId }).ToListAsync(cancellationToken);
        var roles = await db.Roles.AsNoTracking().Where(x => !x.IsDeleted)
            .OrderBy(x => x.RoleId).Select(x => new { x.Code, x.Name, x.Description }).ToListAsync(cancellationToken);
        var fileTypes = await db.FileTypes.AsNoTracking().Where(x => !x.IsDeleted).Select(x => new { x.Code, x.Name }).ToListAsync(cancellationToken);
        return Success(new { Statuses = statuses, Roles = roles, FileTypes = fileTypes });
    }

    [HttpGet("Dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        // DbContext does not support parallel database calls.
        var pendingComments = await db.Comments.CountAsync(x => !x.IsDeleted && x.StatusId == 81, cancellationToken);
        var unassignedServices = await db.ServiceRequests.CountAsync(x => !x.IsDeleted && x.ProviderId == null, cancellationToken);
        var pendingQuality = await db.QualityAssessments.CountAsync(x => !x.IsDeleted && x.QualityGrade == "PENDING", cancellationToken);
        var users = await db.Users.CountAsync(x => !x.IsDeleted, cancellationToken);
        var farms = await db.Farms.CountAsync(x => !x.IsDeleted, cancellationToken);
        var products = await db.AgriculturalProducts.CountAsync(x => !x.IsDeleted, cancellationToken);
        var orders = await db.AgriculturalOrders.CountAsync(x => !x.IsDeleted, cancellationToken);
        return Success(new { PendingComments = pendingComments, UnassignedServices = unassignedServices,
            PendingQuality = pendingQuality, Users = users, Farms = farms, Products = products, Orders = orders, UpdatedAt = now });
    }

    [HttpGet("Audit")]
    public async Task<IActionResult> Audit([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        [FromQuery] EntityStatus? entityStatus = null, [FromQuery] int? entityId = null,
        CancellationToken cancellationToken = default)
    {
        pageNumber = Math.Max(1, pageNumber); pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.StatusChangeLogs.AsNoTracking().Where(x => !x.IsDeleted);
        if (entityStatus.HasValue) query = query.Where(x => x.EntityStatus == entityStatus.Value);
        if (entityId.HasValue) query = query.Where(x => x.EntityId == entityId.Value);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(x => x.ChangeDate).ThenByDescending(x => x.StatusChangeLogId)
            .Skip((pageNumber - 1) * pageSize).Take(pageSize)
            .Select(x => new { x.Code, x.EntityId, x.EntityStatus, x.Comments, x.ChangeDate,
                UserCode = x.User.Code, OldStatusCode = x.OldStatus.Code, NewStatusCode = x.NewStatus.Code })
            .ToListAsync(cancellationToken);
        return Success(new { Items = items, TotalCount = total, PageNumber = pageNumber, PageSize = pageSize });
    }

    [HttpGet("Users/{code}/Roles")]
    public async Task<IActionResult> UserRoles(string code, CancellationToken cancellationToken)
    {
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(x => x.Code == code && !x.IsDeleted, cancellationToken);
        if (user == null) return NotFound(new { message = "کاربر یافت نشد" });
        var codes = await (from assignment in db.UserRoles.AsNoTracking()
                           join role in db.Roles on assignment.RoleId equals role.RoleId
                           where assignment.UserId == user.UserId && !assignment.IsDeleted && !role.IsDeleted
                           select role.Code).ToListAsync(cancellationToken);
        return Success(new { RoleCodes = codes });
    }

    [HttpPatch("Comments/{code}/Moderate")]
    public async Task<IActionResult> Moderate(string code, [FromBody] ModerateCommentRequest request, CancellationToken cancellationToken)
    {
        if (request.Decision is not ("Approve" or "Reject")) return BadRequest(new { message = "تصمیم نامعتبر است" });
        if (request.Decision == "Reject" && string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest(new { message = "دلیل رد الزامی است" });
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var actorId)) return Forbid();
        // Serializable transaction prevents two moderators from silently overriding each other.
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var comment = await db.Comments.SingleOrDefaultAsync(x => x.Code == code && !x.IsDeleted, cancellationToken);
        if (comment == null) return NotFound(new { message = "نظر یافت نشد" });
        var previous = await db.Statuses.SingleAsync(x => x.StatusId == comment.StatusId, cancellationToken);
        if (previous.Code != request.ExpectedStatusCode)
            return Conflict(new { message = "وضعیت این نظر تغییر کرده است؛ دوباره دریافت کنید." });
        // Existing CommentQuery publishes status 82. Keep the application's existing status IDs.
        var destinationId = request.Decision == "Approve" ? 82 : 83;
        var destination = await db.Statuses.SingleOrDefaultAsync(x => x.StatusId == destinationId && x.EntityStatus == EntityStatus.CommentStatus && !x.IsDeleted, cancellationToken);
        if (destination == null) return BadRequest(new { message = "وضعیت تأیید یا رد نظر در دیتابیس موجود نیست؛ وضعیت‌های 82 و 83 را بررسی کنید." });
        if (comment.StatusId == destination.StatusId) return Success(new { comment.Code, StatusCode = destination.Code });
        db.StatusChangeLogs.Add(new StatusChangeLog { EntityId = comment.CommentId, EntityStatus = EntityStatus.CommentStatus,
            UserId = actorId, OldStatusId = comment.StatusId, NewStatusId = destination.StatusId,
            Comments = request.Reason?.Trim(), ChangeDate = DateTimeOffset.UtcNow });
        comment.StatusId = destination.StatusId;
        comment.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Success(new { comment.Code, StatusCode = destination.Code });
    }
}

public sealed class ModerateCommentRequest
{
    [Required] public string Decision { get; set; } = string.Empty;
    [Required, MaxLength(10)] public string ExpectedStatusCode { get; set; } = string.Empty;
    [MaxLength(1000)] public string? Reason { get; set; }
}
