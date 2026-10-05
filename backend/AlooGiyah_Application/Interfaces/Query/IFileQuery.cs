using AlooGiyah_Domain.Enums;
using AlooGiyah_Application.DTOs.File;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IFileQuery
{
    Task<PagedResult<FileDto>> GetFilesAsync(FileFilterDto filter);
    Task<string?> GetPrimaryFileUrlAsync(EntityFile entityFile, string entityCode);
}
