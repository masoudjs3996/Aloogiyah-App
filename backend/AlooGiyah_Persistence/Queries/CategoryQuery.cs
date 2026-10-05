using AlooGiyah_Application.DTOs.Category;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Persistence.Queries;
public class CategoryQuery : BaseQuery, ICategoryQuery
{
    public CategoryQuery(IDbConnectionFactory factory) : base(factory) { }

    private const string Projection = """
to_jsonb(t) || jsonb_build_object('ParentCategoryCode', p."Code", 'StatusCode', COALESCE(s."Code", 'ACTIVE'), 'statusName', COALESCE(s."Name", 'فعال'), 'ImageUrl', (SELECT fi."Url" FROM "Files" fi WHERE fi."EntityCode"=t."Code" AND fi."EntityFile"=7 AND fi."IsPrimary" AND NOT fi."IsDeleted" ORDER BY fi."CreatedAt" DESC, fi."FileId" DESC LIMIT 1))
""";
    private const string From = """
FROM "Categories" t LEFT JOIN "Categories" p ON p."CategoryId"=t."ParentCategoryId" AND NOT p."IsDeleted" LEFT JOIN "Statuses" s ON s."StatusId"=t."StatusId"
""";
    public Task<CategoryDto?> GetByCodeAsync(string code) => QueryJsonFirstAsync<CategoryDto>($"SELECT ({Projection})::text {From} WHERE NOT t.\"IsDeleted\" AND t.\"Code\"=@Code", new { Code = code });
    public async Task<List<CategoryDto>> GetCategoryTreeAsync()
    {
        var rows = await QueryJsonAsync<CategoryDto>($"SELECT ({Projection})::text {From} WHERE NOT t.\"IsDeleted\" ORDER BY t.\"SortOrder\", t.\"CategoryId\"");
        var map = rows.ToDictionary(x => x.Code); var roots = new List<CategoryDto>();
        foreach (var row in rows)
        {
            // Defensive cycle check: corrupt historical parents must not recurse forever in JSON.
            var seen = new HashSet<string> { row.Code }; var parentCode = row.ParentCategoryCode; var cycle = false;
            while (parentCode != null && map.TryGetValue(parentCode, out var parent))
            { if (!seen.Add(parentCode)) { cycle = true; break; } parentCode = parent.ParentCategoryCode; }
            if (!cycle && row.ParentCategoryCode != null && map.TryGetValue(row.ParentCategoryCode, out var immediate)) immediate.SubCategories!.Add(row);
            else roots.Add(row);
        }
        return roots;
    }
    public Task<List<CategoryDto>> GetCategoriesByTypeAsync(CategoryFetchType type)
    {
        var statusId = type switch { CategoryFetchType.Home => 53, CategoryFetchType.Menu => 54, CategoryFetchType.Featured => 55, _ => 0 };
        return QueryJsonAsync<CategoryDto>($"SELECT ({Projection})::text {From} WHERE NOT t.\"IsDeleted\" AND t.\"StatusId\"=@StatusId ORDER BY t.\"SortOrder\", t.\"CategoryId\"", new { StatusId = statusId });
    }
    public Task<PagedResult<CategoryListDto>> GetFilteredAsync(CategoryFilterDto filter)
    {
        var where = new QueryFilter();
        where.Equal("p.\"Code\"", "Parent", filter.ParentCategoryCode);
        where.Equal("s.\"Code\"", "Status", filter.StatusCode);
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm)) where.Add("(strpos(t.\"Name\",@Search)>0 OR strpos(t.\"Code\",@Search)>0)", "Search", filter.SearchTerm);
        return QueryJsonPagedAsync<CategoryListDto>(Projection, From, where, "t.\"SortOrder\", t.\"CategoryId\"", filter.PageNumber, filter.PageSize);
    }
}
