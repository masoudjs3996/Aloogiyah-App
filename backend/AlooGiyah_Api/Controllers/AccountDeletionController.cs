using System.Text.Json;
using AlooGiyah_Api.Realtime;
using AlooGiyah_Application.Commons;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Api.Controllers;

[ApiController, Route("api/User/Account"), Authorize(Policy = "NotGuest")]
public sealed class AccountDeletionController(AlooGiyahDbContext db, ICurrentUserService actor, ChatConnectionManager chat) : ControllerBase
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    [HttpDelete]
    public async Task<IActionResult> Delete(CancellationToken ct)
    {
        if (!int.TryParse(actor.UserId, out var id)) return Unauthorized();
        var now = DateTimeOffset.UtcNow;
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var account = db.Users.Where(x => x.UserId == id && !x.IsDeleted);
        var identity = await account.Select(x => new { x.Code, x.PhoneNumber, x.IsPhoneConfirmed }).SingleOrDefaultAsync(ct);
        if (identity is null) return Unauthorized();
        var replacement = "deleted_" + Guid.NewGuid().ToString("N");

        // Preserve relational keys used by historical transactions, and erase the profile and credentials.
        var removed = await account.ExecuteUpdateAsync(set => set
            .SetProperty(x => x.IsDeleted, true).SetProperty(x => x.UpdatedAt, now)
            .SetProperty(x => x.TokenVersion, x => x.TokenVersion + 1)
            .SetProperty(x => x.UserName, replacement).SetProperty(x => x.Password, "").SetProperty(x => x.PhoneNumber, "")
            .SetProperty(x => x.FName, "کاربر حذف‌شده").SetProperty(x => x.LName, (string?)null)
            .SetProperty(x => x.Email, (string?)null).SetProperty(x => x.IsEmailConfirmed, false)
            .SetProperty(x => x.IsPhoneConfirmed, false)
            .SetProperty(x => x.EmailVerificationCode, (string?)null).SetProperty(x => x.VerificationCodeExpiration, (DateTimeOffset?)null)
            .SetProperty(x => x.PasswordResetCode, (string?)null).SetProperty(x => x.PasswordResetExpiration, (DateTimeOffset?)null), ct);
        if (removed == 0) return Unauthorized();

        await db.RefreshToken.Where(x => x.UserId == id).ExecuteDeleteAsync(ct);
        await db.PushRegistrations.Where(x => x.UserId == id).ExecuteDeleteAsync(ct);
        await db.Notifications.Where(x => x.UserId == id).ExecuteDeleteAsync(ct);
        await db.SavedListings.Where(x => x.UserId == id).ExecuteDeleteAsync(ct);
        await db.SavedProducts.Where(x => x.UserId == id).ExecuteDeleteAsync(ct);
        await db.PhoneOtpChallenges.Where(x => x.RequestedByUserId == id ||
            (identity.IsPhoneConfirmed && x.RequestedByUserId == null && x.PhoneNumber == identity.PhoneNumber))
            .ExecuteDeleteAsync(ct);

        await DeletePublishedDataAsync(id, now, ct);
        await DeletePrivateDataAsync(id, now, ct);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        chat.Disconnect(identity.Code);
        return Ok(new ApiResponse<bool> { IsSuccess = true, Data = true });
    }

    private async Task DeletePublishedDataAsync(int id, DateTimeOffset now, CancellationToken ct)
    {
        var listings = db.AgriculturalListings.Where(x => x.Farm.OwnerId == id);
        var listingPhotos = await listings.Select(x => x.ImageUrls).ToListAsync(ct);
        var files = db.Files.Where(x => x.UserId == id);
        var uploads = await files.Select(x => x.Url).ToListAsync(ct);
        Queue("upload", uploads.Concat(listingPhotos.SelectMany(x => x)), now);
        await db.ChatMessageAttachments.Where(x => x.File.UserId == id || x.Message.SenderId == id).ExecuteDeleteAsync(ct);
        await files.ExecuteDeleteAsync(ct);
        await listings.ExecuteUpdateAsync(set => set.SetProperty(x => x.IsDeleted, true).SetProperty(x => x.IsPublished, false)
            .SetProperty(x => x.UpdatedAt, now).SetProperty(x => x.Name, "آگهی حذف‌شده").SetProperty(x => x.Slug, "")
            .SetProperty(x => x.Description, "").SetProperty(x => x.ImageUrls, new List<string>()), ct);
        await db.AgriculturalProducts.Where(x => x.Farm.OwnerId == id)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.IsDeleted, true).SetProperty(x => x.UpdatedAt, now), ct);
        await db.Farms.Where(x => x.OwnerId == id)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.IsDeleted, true).SetProperty(x => x.UpdatedAt, now)
                .SetProperty(x => x.Name, "مزرعه حذف‌شده").SetProperty(x => x.Description, "").SetProperty(x => x.AddressId, (int?)null), ct);
        await db.Comments.Where(x => x.UserId == id).ExecuteUpdateAsync(set => set.SetProperty(x => x.IsDeleted, true)
            .SetProperty(x => x.UpdatedAt, now).SetProperty(x => x.Content, "").SetProperty(x => x.Rating, (int?)null), ct);
    }

    private async Task DeletePrivateDataAsync(int id, DateTimeOffset now, CancellationToken ct)
    {
        await db.Addresses.Where(x => x.UserId == id)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.IsDeleted, true).SetProperty(x => x.UpdatedAt, now)
                .SetProperty(x => x.Street, "").SetProperty(x => x.PostalCode, "").SetProperty(x => x.Latitude, (double?)null)
                .SetProperty(x => x.Longitude, (double?)null).SetProperty(x => x.CityId, (int?)null).SetProperty(x => x.VillageId, (int?)null), ct);

        var applications = db.BusinessApplications.Where(x => x.UserId == id);
        var documents = await applications.Select(x => x.DocumentsJson).ToListAsync(ct);
        Queue("business", documents.SelectMany(x => JsonSerializer.Deserialize<List<BusinessDocument>>(x, Json) ?? []).Select(x => x.Key), now);
        await applications.ExecuteUpdateAsync(set => set.SetProperty(x => x.IsDeleted, true).SetProperty(x => x.UpdatedAt, now)
            .SetProperty(x => x.BusinessName, "").SetProperty(x => x.Description, "").SetProperty(x => x.LicenseNumber, (string?)null)
            .SetProperty(x => x.AddressJson, "{}").SetProperty(x => x.DocumentsJson, "[]").SetProperty(x => x.HistoryJson, "[]")
            .SetProperty(x => x.VisitNote, (string?)null).SetProperty(x => x.ReviewNote, (string?)null), ct);

        var messages = db.ChatMessages.Where(x => x.SenderId == id);
        Queue("chat", await messages.Where(x => x.AttachmentKey != null).Select(x => x.AttachmentKey!).ToListAsync(ct), now);
        await db.ChatMessageReports.Where(x => x.ReporterId == id).ExecuteDeleteAsync(ct);
        await db.ChatMessageReports.Where(x => x.Message.SenderId == id)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.MessageText, ""), ct);
        await messages.ExecuteUpdateAsync(set => set.SetProperty(x => x.IsDeleted, true).SetProperty(x => x.UpdatedAt, now)
            .SetProperty(x => x.Message, "").SetProperty(x => x.AttachmentKey, (string?)null).SetProperty(x => x.AttachmentName, (string?)null)
            .SetProperty(x => x.AttachmentType, (string?)null).SetProperty(x => x.AttachmentSize, (long?)null)
            .SetProperty(x => x.AttachmentPreview, (string?)null), ct);
        await db.ProductReports.Where(x => x.ReporterId == id).ExecuteDeleteAsync(ct);
        await db.ProductInquiries.Where(x => x.BuyerId == id)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.BuyerMessage, (string?)null), ct);
    }

    private void Queue(string storage, IEnumerable<string> keys, DateTimeOffset now) => db.AccountFileDeletions.AddRange(
        keys.Where(key => !string.IsNullOrWhiteSpace(key)).Distinct(StringComparer.Ordinal)
            .Select(key => new AccountFileDeletion { Storage = storage, Key = key, RetryAt = now }));
}
