using AlooGiyah_Application.DTOs.Article;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
namespace AlooGiyah_Persistence.Queries;
public class ArticleQuery : BaseQuery, IArticleQuery
{
    private readonly ICurrentUserService _currentUser;
    public ArticleQuery(IDbConnectionFactory factory, ICurrentUserService currentUser) : base(factory)
    { _currentUser = currentUser; }
    private const string Projection = """
to_jsonb(t) || jsonb_build_object('AuthorCode', u."Code", 'CategoryCodes', COALESCE((SELECT jsonb_agg(c."Code" ORDER BY c."CategoryId") FROM "ArticleCategory" j JOIN "Categories" c ON c."CategoryId" = j."CategoriesCategoryId" WHERE j."ArticlesArticleId" = t."ArticleId" AND NOT c."IsDeleted"), '[]'::jsonb))
""";
    private const string From = """
FROM "Articles" t LEFT JOIN "Users" u ON u."UserId" = t."AuthorId"
""";
    private QueryFilter BaseFilter()
    {
        var where = new QueryFilter();
        
        
        return where;
    }
    public Task<ArticleDto?> GetByCodeAsync(string code)
    {
        var where = BaseFilter(); where.Add("t.\"Code\" = @Code", "Code", code);
        return QueryJsonFirstAsync<ArticleDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters);
    }
    public Task<PagedResult<ArticleListDto>> GetByFilterAsync(ArticleFilterDto filter)
    {
        var where = BaseFilter();
        where.Equal("""
u."Code"
""", "AuthorCode", filter.AuthorCode);
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm)) where.Add("""
(strpos(t."Title", @SearchTerm)>0 OR strpos(t."Content", @SearchTerm)>0)
""", "SearchTerm", filter.SearchTerm);
        if (!string.IsNullOrWhiteSpace(filter.CategoryCode)) where.Add("""
EXISTS (SELECT 1 FROM "ArticleCategory" j JOIN "Categories" c ON c."CategoryId" = j."CategoriesCategoryId" WHERE j."ArticlesArticleId"=t."ArticleId" AND NOT c."IsDeleted" AND c."Code"=@CategoryCode)
""", "CategoryCode", filter.CategoryCode);
        return QueryJsonPagedAsync<ArticleListDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"ArticleId\" DESC", filter.PageNumber, filter.PageSize);
    }
}
