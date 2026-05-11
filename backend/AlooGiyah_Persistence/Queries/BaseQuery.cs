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

    protected async Task<T> ExecuteScalarAsync<T>(
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
        using var conn = CreateConnection();

        parameters.Add("Offset", (pageNumber - 1) * pageSize);
        parameters.Add("PageSize", pageSize);

        var finalSql = new StringBuilder();
        finalSql.AppendLine(baseSql);
        finalSql.AppendLine("OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;");
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
}