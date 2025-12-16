using AlooGiyah_Domain.Enums;
using Microsoft.AspNetCore.Http;
using AlooGiyah_Domain.ValueObjects;

namespace AlooGiyah_Domain.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(IFormFile file, EntityFile entityFile, string? entityCode = null, bool useDateFolder = false);
    Task<StoredFile> SaveFileInternalAsync (IFormFile file,EntityFile entityFile,bool useDateFolder);
    Task DeleteFileAsync(string relativePath);
}
