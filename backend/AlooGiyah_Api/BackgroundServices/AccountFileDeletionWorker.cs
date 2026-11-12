using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Api.BackgroundServices;

public sealed class AccountFileDeletionWorker(IServiceScopeFactory scopes, ILogger<AccountFileDeletionWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = scopes.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AlooGiyahDbContext>();
                var pending = await db.AccountFileDeletions.Where(x => x.RetryAt <= DateTimeOffset.UtcNow)
                    .OrderBy(x => x.Id).Take(100).ToListAsync(stoppingToken);
                foreach (var item in pending)
                {
                    try
                    {
                        switch (item.Storage)
                        {
                            case "upload":
                                if (!await db.Files.AnyAsync(x => x.Url == item.Key && !x.IsDeleted, stoppingToken) &&
                                    !await db.AgriculturalListings.AnyAsync(x => !x.IsDeleted && x.ImageUrls.Contains(item.Key), stoppingToken))
                                    await scope.ServiceProvider.GetRequiredService<IFileStorageService>().DeleteFileAsync(item.Key);
                                break;
                            case "business":
                                scope.ServiceProvider.GetRequiredService<IBusinessDocumentStorage>().Delete(item.Key);
                                break;
                            case "chat":
                                if (!await db.ChatMessages.AnyAsync(x => x.AttachmentKey == item.Key && !x.IsDeleted, stoppingToken))
                                    scope.ServiceProvider.GetRequiredService<IChatFileStorage>().Delete(item.Key);
                                break;
                            default: throw new InvalidOperationException("Unknown account file storage.");
                        }
                        db.AccountFileDeletions.Remove(item);
                    }
                    catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
                    {
                        item.RetryAt = DateTimeOffset.UtcNow.AddMinutes(5);
                        logger.LogWarning(ex, "Account file deletion {Id} will be retried", item.Id);
                    }
                }
                await db.SaveChangesAsync(stoppingToken);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                logger.LogError(ex, "Could not process account file deletions");
            }
        }
    }
}
