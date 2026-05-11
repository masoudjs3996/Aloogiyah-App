using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using Dapper;

namespace AlooGiyah_Persistence.Queries;

public class UserQuery : BaseQuery, IUserQuery
{
    public UserQuery(IDbConnectionFactory factory)
        : base(factory)
    {
    }

    // Persistence/Queries/UserQueryRepository.cs
    public async Task<UserDto?> GetByIdAsync(int userId, bool includeRole = true)
    {
        var sql = includeRole
            ? """
              SELECT 
                  u."Code", u."FName", u."LName", u."Email", u."UserName",
                  u."PhoneNumber", u."Age", u."IsEmailConfirmed",
                  u."CreatedAt", u."UpdatedAt",
                  r."Code" AS "RoleCode",
                  r."Name" AS "RoleName"
              FROM "Users" u
              INNER JOIN "Roles" r ON u."RoleId" = r."RoleId"
              WHERE u."UserId" = @UserId AND u."IsDeleted" = false
              """
            : """
              SELECT 
                  u."Code", u."FName", u."LName", u."Email", u."UserName",
                  u."PhoneNumber", u."Age", u."IsEmailConfirmed",
                  u."CreatedAt", u."UpdatedAt"
              FROM "Users" u
              WHERE u."UserId" = @UserId AND u."IsDeleted" = false
              """;

        return await QueryFirstOrDefaultAsync<UserDto>(sql, new { UserId = userId });
    }

    public async Task<UserDto?> GetByCodeAsync(string code, bool includeRole = true)
    {


        string sql = includeRole
            ? """
          SELECT 
              u."Code", u."FName", u."LName", u."Email", u."UserName", u."PhoneNumber", 
              u."Age", u."IsEmailConfirmed", u."CreatedAt", u."UpdatedAt",
              r."Code" AS "RoleCode", r."Name" AS "Name"
          FROM "Users" u
          INNER JOIN "Roles" r ON u."RoleId" = r."RoleId"
          WHERE u."Code" = @Code AND u."IsDeleted" = false
          """
            : """
          SELECT 
              u."Code", u."FName", u."LName", u."Email", u."UserName", u."PhoneNumber", 
              u."Age", u."IsEmailConfirmed", u."CreatedAt", u."UpdatedAt"
          FROM "Users" u
          WHERE u."Code" = @Code AND u."IsDeleted" = false
          """;

        return await QueryFirstOrDefaultAsync<UserDto>(sql, new { Code = code });
    }



    public async Task<User?> GetByUsernameAsync(string username)
    {
        if (string.IsNullOrWhiteSpace(username))
            throw new ArgumentNullException(nameof(username));

        const string sql = """
        SELECT 
            u."UserId",
            u."Code",
            u."CreatedAt",
            u."UpdatedAt",
            u."IsDeleted",
            u."FName",
            u."LName",
            u."Email",
            u."UserName",
            u."Password",
            u."PhoneNumber",
            u."Age",
            u."IsEmailConfirmed",

            r."RoleId",
            r."Code"        AS "RoleCode",
            r."Name"        AS "Name",
            r."Description" AS "RoleDescription"

        FROM "Users" u
        INNER JOIN "Roles" r ON u."RoleId" = r."RoleId"
        WHERE u."UserName" = @UserName
          AND u."IsDeleted" = false
        LIMIT 1
        """;

        using var conn = CreateConnection();

        var result = await conn.QueryAsync<User, Role, User>(
            sql,
            (user, role) =>
            {
                user.Role = role;
                return user;
            },
            new { UserName = username },
            splitOn: "RoleId"
        );

        return result.FirstOrDefault();
    }

    public async Task<bool> ExistsByUsernameAsync(string username)
    {
        const string sql = """
            SELECT 1
            FROM "Users"
            WHERE "UserName" = @UserName
              AND "IsDeleted" = false
            """;

        var result = await ExecuteScalarAsync<int?>(sql, new { UserName = username });
        return result.HasValue;
    }

    public async Task<PagedResult<UserDto>> GetPagedFilteredAsync(UserFilterDto filter)
    {
        var whereParts = new List<string> { "u.\"IsDeleted\" = false" };
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(filter.FName))
        {
            whereParts.Add("u.\"FName\" ILIKE @FName");
            parameters.Add("FName", $"%{filter.FName}%");
        }

        if (!string.IsNullOrWhiteSpace(filter.RoleCode))
        {
            whereParts.Add("r.\"Code\" = @RoleCode");
            parameters.Add("RoleCode", filter.RoleCode);
        }

        var whereClause = string.Join(" AND ", whereParts);

        var baseSql = $"""
            SELECT 
                u."Code",
                u."FName",
                u."LName",
                u."Email",
                u."Name",
                u."PhoneNumber",
                r."Code" AS "RoleCode",
                r."Name" AS "RoleName",
                u."CreatedAt",
                u."UpdatedAt"
            FROM "Users" u
            INNER JOIN "Roles" r ON u."RoleId" = r."RoleId"
            WHERE {whereClause}
            """;

        var countSql = $"""
            SELECT COUNT(*)
            FROM "Users" u
            INNER JOIN "Roles" r ON u."RoleId" = r."RoleId"
            WHERE {whereClause}
            """;

        var orderBy = ApplySorting(
            defaultOrderBy: "u.\"CreatedAt\" DESC",
            sortColumn: filter.SortColumn,
            descending: filter.SortDescending,
            allowedColumns: new[]
            {
                "u.\"CreatedAt\"",
                "u.\"FName\"",
                "u.\"LName\"",
                "u.\"Name\""
            });

        baseSql += "\n" + orderBy;

        return await QueryPagedAsync<UserDto>(
            baseSql,
            countSql,
            parameters,
            filter.PageNumber,
            filter.PageSize);
    }
}
