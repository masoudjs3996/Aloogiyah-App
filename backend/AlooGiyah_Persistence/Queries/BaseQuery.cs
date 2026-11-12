using AlooGiyah_Domain.Pagination;
using AlooGiyah_Domain.Interfaces;
using Dapper;
using System.Data;
using System.Text;

namespace AlooGiyah_Persistence.Queries;

public abstract class BaseQuery
{
    private readonly IDbConnectionFactory _connectionFactory;

    protected BaseQuery(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    protected IDbConnection CreateConnection()
        => _connectionFactory.CreateConnection();

    #region Basic Query Helpers

    protected async Task<T?> QueryFirstOrDefaultAsync<T>(
        string sql,
        object? param = null)
    {
        using var conn = CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<T>(sql, param);
    }

    protected async Task<IEnumerable<T>> QueryAsync<T>(
        string sql,
        object? param = null)
    {
        using var conn = CreateConnection();
        return await conn.QueryAsync<T>(sql, param);
    }

    protected async Task<T?> ExecuteScalarAsync<T>(
        string sql,
        object? param = null)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<T>(sql, param);
    }

    #endregion

    #region Pagination

    protected async Task<PagedResult<T>> QueryPagedAsync<T>(
        string baseSql,
        string countSql,
        DynamicParameters parameters,
        int pageNumber,
        int pageSize)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);
        using var conn = CreateConnection();

        parameters.Add("Offset", (pageNumber - 1) * pageSize);
        parameters.Add("PageSize", pageSize);

        var finalSql = new StringBuilder();
        finalSql.AppendLine(baseSql);
        finalSql.AppendLine("LIMIT @PageSize OFFSET @Offset;");
        finalSql.AppendLine(countSql);

        using var multi = await conn.QueryMultipleAsync(finalSql.ToString(), parameters);

        var items = (await multi.ReadAsync<T>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();

        return new PagedResult<T>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    #endregion

    #region Safe Sorting

    protected string ApplySorting(
        string defaultOrderBy,
        string? sortColumn,
        bool descending,
        params string[] allowedColumns)
    {
        if (string.IsNullOrWhiteSpace(sortColumn) ||
            !allowedColumns.Contains(sortColumn))
        {
            return $"ORDER BY {defaultOrderBy}";
        }

        var direction = descending ? "DESC" : "ASC";
        return $"ORDER BY {sortColumn} {direction}";
    }

    #endregion

    private static readonly System.Text.Json.JsonSerializerOptions JsonOptions = CreateJsonOptions();
    private static System.Text.Json.JsonSerializerOptions CreateJsonOptions()
    {
        var resolver = new System.Text.Json.Serialization.Metadata.DefaultJsonTypeInfoResolver();
        resolver.Modifiers.Add(info =>
        {
            // Domain codes have a private setter; preserve stored codes when hydrating read graphs.
            if (typeof(AlooGiyah_Domain.Entities.BaseEntity).IsAssignableFrom(info.Type))
            {
                var code = info.Properties.FirstOrDefault(x => x.Name == "Code");
                if (code != null) code.Set = (entity, value) =>
                    typeof(AlooGiyah_Domain.Entities.BaseEntity).GetProperty("Code")!.SetValue(entity, value);
            }
        });
        return new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true, TypeInfoResolver = resolver };
    }
    protected async Task<T?> QueryJsonFirstAsync<T>(string sql, object? parameters = null) where T : class
    {
        using var conn = CreateConnection();
        var json = await conn.QuerySingleOrDefaultAsync<string>(sql, parameters);
        return json == null ? null : System.Text.Json.JsonSerializer.Deserialize<T>(json, JsonOptions);
    }
    protected async Task<List<T>> QueryJsonAsync<T>(string sql, object? parameters = null)
    {
        using var conn = CreateConnection();
        var rows = await conn.QueryAsync<string>(sql, parameters);
        return rows.Select(x => System.Text.Json.JsonSerializer.Deserialize<T>(x, JsonOptions)!).ToList();
    }
    protected async Task<PagedResult<T>> QueryJsonPagedAsync<T>(string projection, string from,
        QueryFilter filter, string orderBy, int pageNumber, int pageSize)
    {
        pageNumber = Math.Max(1, pageNumber); pageSize = Math.Clamp(pageSize, 1, 100);
        filter.Parameters.Add("Offset", checked((pageNumber - 1) * pageSize));
        filter.Parameters.Add("PageSize", pageSize);
        // Same snapshot for count and rows, even while orders change in another request.
        using var conn = CreateConnection(); conn.Open();
        using var transaction = conn.BeginTransaction(System.Data.IsolationLevel.RepeatableRead);
        var sql = $"SELECT ({projection})::text {from} {filter.Where} ORDER BY {orderBy} LIMIT @PageSize OFFSET @Offset; " +
            $"SELECT COUNT(*) {from} {filter.Where};";
        using var multi = await conn.QueryMultipleAsync(sql, filter.Parameters, transaction);
        var rows = (await multi.ReadAsync<string>()).Select(x => System.Text.Json.JsonSerializer.Deserialize<T>(x, JsonOptions)!).ToList();
        var count = await multi.ReadSingleAsync<int>();
        transaction.Commit();
        return new PagedResult<T> { Items = rows, TotalCount = count, PageNumber = pageNumber, PageSize = pageSize };
    }
}
