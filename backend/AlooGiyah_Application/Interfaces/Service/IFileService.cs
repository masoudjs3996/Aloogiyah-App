using AlooGiyah_Application.DTOs.File;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Pagination;
using Microsoft.AspNetCore.Http;

namespace AlooGiyah_Application.Interfaces.Service;

public interface IFileService
{
    Task<FileDto> UploadFileAsync(FileUploadDto dto);
    Task DeleteFileByCodeAsync(string fileCode);
    Task<PagedResult<FileDto>> GetFilesAsync(FileFilterDto filter);
    Task AttachFileAsPrimaryAsync(string fileCode, EntityFile entityFile, string entityCode);
    Task<string?> GetPrimaryFileUrlAsync(EntityFile entityFile, string entityCode);
    Task RemovePrimaryFileAsync(EntityFile entityFile, string entityCode);
}
