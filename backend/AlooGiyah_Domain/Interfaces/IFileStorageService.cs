
using AlooGiyah_Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace AlooGiyah_Domain.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(IFormFile file, EntityFile entityFile, string? entityCode = null, bool useDateFolder = false);
    Task DeleteFileAsync(string relativePath);
}
