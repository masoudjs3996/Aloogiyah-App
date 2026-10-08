using AlooGiyah_Application.DTOs.Comment;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Exceptions;
using Dapper;
namespace AlooGiyah_Persistence.Queries;
public class CommentQuery : BaseQuery, ICommentQuery
{
    private readonly ICurrentUserService _user;
    public CommentQuery(IDbConnectionFactory factory, ICurrentUserService user) : base(factory) { _user = user; }

    private const string Projection = """
to_jsonb(t) || jsonb_build_object('UserCode', u."Code", 'Name', concat_ws(' ', u."FName", u."LName"), 'StatusCode', s."Code", 'ParentId', t."ParentCommentId", 'ParentCode', p."Code")
""";
    private const string From = """
FROM "Comments" t JOIN "Users" u ON u."UserId"=t."UserId" JOIN "Statuses" s ON s."StatusId"=t."StatusId" LEFT JOIN "Comments" p ON p."CommentId"=t."ParentCommentId"
""";
    public async Task<CommentDto?> GetByCodeAsync(string code)
    {
        var where = new QueryFilter(); where.Parameters.Add("Manager", QueryAccess.IsManager(_user)); where.Parameters.Add("Viewer", int.TryParse(_user.UserId, out var viewer) && !_user.IsGuest ? viewer : -1); where.Add("t.\"Code\"=@Code", "Code", code);
        // Public reads expose approved comments; authors and managers can inspect pending ones.
        RestrictStatus(where);
        var detail = Projection + " || " + """
jsonb_build_object('SubComments', COALESCE((SELECT jsonb_agg(to_jsonb(sc) || jsonb_build_object('UserCode', su."Code", 'Name', concat_ws(' ', su."FName", su."LName"), 'StatusCode', ss."Code", 'ParentId', sc."ParentCommentId", 'ParentCode', t."Code", 'SubComments', COALESCE((SELECT jsonb_agg(to_jsonb(gc) || jsonb_build_object('UserCode', gu."Code", 'Name', concat_ws(' ', gu."FName", gu."LName"), 'StatusCode', gs."Code", 'ParentId', gc."ParentCommentId", 'ParentCode', sc."Code") ORDER BY gc."CreatedAt",gc."CommentId") FROM "Comments" gc JOIN "Users" gu ON gu."UserId"=gc."UserId" JOIN "Statuses" gs ON gs."StatusId"=gc."StatusId" WHERE gc."ParentCommentId"=sc."CommentId" AND NOT gc."IsDeleted" AND (gc."StatusId"=82 OR @Manager OR gc."UserId"=@Viewer)), '[]'::jsonb)) ORDER BY sc."CreatedAt",sc."CommentId") FROM "Comments" sc JOIN "Users" su ON su."UserId"=sc."UserId" JOIN "Statuses" ss ON ss."StatusId"=sc."StatusId" WHERE sc."ParentCommentId"=t."CommentId" AND NOT sc."IsDeleted" AND (sc."StatusId"=82 OR @Manager OR sc."UserId"=@Viewer)), '[]'::jsonb))
""";
        return await QueryJsonFirstAsync<CommentDto>($"SELECT ({detail})::text {From} {where.Where}", where.Parameters);
    }
    private void RestrictStatus(QueryFilter where)
    {
        if (!QueryAccess.IsManager(_user))
        {
            if (_user.IsAuthenticated && !_user.IsGuest && int.TryParse(_user.UserId, out var id)) where.Add("(t.\"StatusId\"=82 OR t.\"UserId\"=@CurrentUserId)", "CurrentUserId", id);
            else where.Add("t.\"StatusId\"=82");
        }
    }
    public Task<PagedResult<CommentDto>> GetByFilterAsync(CommentFilterDto filter)
    {
        var where = new QueryFilter(); RestrictStatus(where);
        where.Equal("t.\"EntityCode\"", "EntityCode", filter.EntityCode); where.Equal("t.\"EntityComment\"", "Entity", filter.EntityComment);
        where.Equal("s.\"Code\"", "Status", filter.StatusCode); where.Compare("t.\"Rating\"", ">=", "Min", filter.MinRating); where.Compare("t.\"Rating\"", "<=", "Max", filter.MaxRating);
        where.Compare("t.\"CreatedAt\"", ">=", "Start", filter.StartDate); where.Compare("t.\"CreatedAt\"", "<=", "End", filter.EndDate);
        return QueryJsonPagedAsync<CommentDto>(Projection, From, where, "t.\"CreatedAt\" DESC,t.\"CommentId\" DESC", filter.PageNumber, filter.PageSize);
    }
    public async Task<List<CommentDto>> GetTreeCommentsAsync(CommentTreeFilterDto filter)
    {
        var where = new QueryFilter(); where.Add("t.\"StatusId\"=82 AND t.\"ParentCommentId\" IS NULL");
        where.Equal("t.\"EntityCode\"", "EntityCode", filter.EntityCode); where.Equal("t.\"EntityComment\"", "Entity", filter.EntityComment);
        var projection = Projection + """
 || jsonb_build_object('SubComments', COALESCE((SELECT jsonb_agg(to_jsonb(sc) || jsonb_build_object('UserCode', su."Code", 'Name', concat_ws(' ', su."FName", su."LName"), 'StatusCode', ss."Code", 'ParentId', sc."ParentCommentId", 'ParentCode', t."Code") ORDER BY sc."CreatedAt",sc."CommentId") FROM "Comments" sc JOIN "Users" su ON su."UserId"=sc."UserId" JOIN "Statuses" ss ON ss."StatusId"=sc."StatusId" WHERE sc."ParentCommentId"=t."CommentId" AND NOT sc."IsDeleted" AND sc."StatusId"=82), '[]'::jsonb))
""";
        var page = await QueryJsonPagedAsync<CommentDto>(projection, From, where, "t.\"CreatedAt\" DESC,t.\"CommentId\" DESC", filter.PageNumber, filter.PageSize);
        return page.Items.ToList();
    }

    public async Task<CommentRatingSummaryDto> GetRatingSummaryAsync(string entityCode, EntityComment entityComment)
    {
        const string sql = """
SELECT COALESCE(ROUND(AVG("Rating")::numeric, 1), 0) AS "AverageRating",
       COUNT("Rating")::int AS "RatingCount"
FROM "Comments"
WHERE "EntityCode" = @EntityCode
  AND "EntityComment" = @EntityComment
  AND "StatusId" = 82
  AND NOT "IsDeleted"
  AND "ParentCommentId" IS NULL
  AND "Rating" BETWEEN 1 AND 5;
""";
        using var connection = CreateConnection();
        return await connection.QuerySingleAsync<CommentRatingSummaryDto>(sql, new { EntityCode = entityCode, EntityComment = (int)entityComment });
    }

    public Task<CommentDto?> GetMyProductReviewAsync(string entityCode, EntityComment entityComment, int userId)
    {
        var where = new QueryFilter();
        where.Add("t.\"UserId\"=@UserId AND t.\"EntityCode\"=@EntityCode AND t.\"EntityComment\"=@EntityComment AND t.\"ParentCommentId\" IS NULL AND NOT t.\"IsDeleted\"",
            "UserId", userId);
        where.Parameters.Add("EntityCode", entityCode);
        where.Parameters.Add("EntityComment", (int)entityComment);
        return QueryJsonFirstAsync<CommentDto>($"SELECT ({Projection})::text {From} {where.Where} ORDER BY t.\"IsUniqueProductReview\" DESC,t.\"CreatedAt\" DESC LIMIT 1", where.Parameters);
    }
}
