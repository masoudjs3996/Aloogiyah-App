using AlooGiyah_Application.DTOs.File;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Persistence.Queries;
public class FileQuery : BaseQuery, IFileQuery
{
    private readonly ICurrentUserService _user;
    public FileQuery(IDbConnectionFactory factory, ICurrentUserService user) : base(factory) { _user = user; }

    public Task<string?> GetPrimaryFileUrlAsync(EntityFile entityFile, string entityCode) => QueryFirstOrDefaultAsync<string>("""
SELECT "Url" FROM "Files" WHERE NOT "IsDeleted" AND "IsPrimary" AND "EntityFile"=@Entity AND "EntityCode"=@Code ORDER BY "CreatedAt" DESC, "FileId" DESC LIMIT 1
""", new { Entity = (int)entityFile, Code = entityCode });
    public Task<PagedResult<FileDto>> GetFilesAsync(FileFilterDto filter)
    {
        QueryAccess.UserId(_user); var where = new QueryFilter(); QueryAccess.Owner(where, _user, "t.\"UserId\"");
        where.Equal("u.\"Code\"", "UserCode", filter.UserCode); where.Equal("ft.\"Code\"", "FileTypeCode", filter.FileTypeCode);
        where.Equal("t.\"EntityFile\"", "Entity", filter.EntityFile); where.Equal("t.\"EntityCode\"", "Code", filter.EntityCode);
        where.Contains("t.\"Description\"", "Search", filter.SearchText);
        return QueryJsonPagedAsync<FileDto>("""
to_jsonb(t) || jsonb_build_object('FileCode', t."Code", 'UserCode', u."Code", 'FileTypeCode', ft."Code")
""", """
FROM "Files" t LEFT JOIN "Users" u ON u."UserId"=t."UserId" LEFT JOIN "FileTypes" ft ON ft."FileTypeId"=t."FileTypeId"
""", where, "t.\"CreatedAt\" DESC, t.\"FileId\" DESC", filter.PageNumber, filter.PageSize);
    }
}
