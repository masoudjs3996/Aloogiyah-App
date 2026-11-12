using AlooGiyah_Domain.ValueObjects;
using Microsoft.AspNetCore.Http;
namespace AlooGiyah_Domain.Interfaces;
public interface IChatFileStorage
{
    Task<ChatStoredFile> SaveAsync(IFormFile file, CancellationToken cancellationToken = default);
    Stream Open(string key);
    void Delete(string key);
}
