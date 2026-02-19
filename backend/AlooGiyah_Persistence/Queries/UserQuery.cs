using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using Dapper;

namespace AlooGiyah_Persistence.Queries;

public class UserQuery : IUserQuery
{
    private readonly IDbConnectionFactory _connectionFactory;

    public UserQuery(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Persistence/Queries/UserQueryRepository.cs
    public async Task<UserDto?> GetByIdAsync(int userId, bool includeRole = true)
    {
         using var conn = _connectionFactory.CreateConnection();

        string sql = includeRole
            ? """
          SELECT 
              u."Code", u."FName", u."LName", u."Email", u."UserName", u."PhoneNumber", 
              u."Age", u."IsEmailConfirmed", u."CreatedAt", u."UpdatedAt",
              r."Code" AS "RoleCode", r."Name" AS "RoleName"
          FROM "Users" u
          INNER JOIN "Roles" r ON u."RoleId" = r."RoleId"
          WHERE u."UserId" = @UserId AND u."IsDeleted" = false
          """
            : """
          SELECT 
              u."Code", u."FName", u."LName", u."Email", u."UserName", u."PhoneNumber", 
              u."Age", u."IsEmailConfirmed", u."CreatedAt", u."UpdatedAt"
          FROM "Users" u
          WHERE u."UserId" = @UserId AND u."IsDeleted" = false
          """;

        return await conn.QueryFirstOrDefaultAsync<UserDto>(
            sql,
            new { UserId = userId }
        );
    }

    public async Task<UserDto?> GetByCodeAsync(string code, bool includeRole = true)
    {
        // بدون await using – فقط using معمولی
        using var conn = _connectionFactory.CreateConnection();

        string sql = includeRole
            ? """
          SELECT 
              u."Code", u."FName", u."LName", u."Email", u."UserName", u."PhoneNumber", 
              u."Age", u."IsEmailConfirmed", u."CreatedAt", u."UpdatedAt",
              r."Code" AS "RoleCode", r."Name" AS "RoleName"
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

        return await conn.QueryFirstOrDefaultAsync<UserDto>(sql, new { Code = code });
    }



    public async Task<User?> GetByUsernameAsync(string username)
    {
        if (string.IsNullOrEmpty(username))
            throw new ArgumentNullException(nameof(username));

        using var conn = _connectionFactory.CreateConnection();

        const string sql = """
    SELECT 
        u."Code", u."CreatedAt", u."UpdatedAt", u."IsDeleted",
        u."UserId", u."FName", u."LName", u."Email",
        u."UserName", u."Password", u."PhoneNumber", u."Age",
        u."IsEmailConfirmed",
        r."RoleId",
        r."Code" AS "Code",          -- ← برای Role.Code
        r."Name" AS "Name",          -- ← دقیقاً Name برای Role.Name
        r."Description" AS "Description"
    FROM "Users" u
    INNER JOIN "Roles" r ON u."RoleId" = r."RoleId"
    WHERE u."UserName" = @UserName 
      AND u."IsDeleted" = false
    LIMIT 1
""";

        var result = await conn.QueryAsync<User, Role, User>(
            sql,
            (user, role) =>
            {
                user.Role = role;
                return user;
            },
            new { UserName = username },
            splitOn: "RoleId"   // یا "Code" – نقطه شروع ستون‌های Role
        );

        return result.FirstOrDefault();
    }

    public async Task<bool> ExistsByUsernameAsync(string username)
    {
        using var conn = _connectionFactory.CreateConnection();

        const string sql = """
        SELECT 1 
        FROM "Users" 
        WHERE "UserName" = @UserName 
          AND "IsDeleted" = false
        """;

        var result = await conn.ExecuteScalarAsync<bool?>(sql, new { UserName = username });

        return result == true;
    }

    public async Task<PagedResult<UserDto>> GetPagedFilteredAsync(UserFilterDto filter)
    {
        using var conn = _connectionFactory.CreateConnection();

        var whereParts = new List<string> { "u.IsDeleted = 0" };
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(filter.FName))
        {
            whereParts.Add("u.FName LIKE @FName");
            parameters.Add("FName", $"%{filter.FName}%");
        }

        if (!string.IsNullOrWhiteSpace(filter.LName))
        {
            whereParts.Add("u.LName LIKE @LName");
            parameters.Add("LName", $"%{filter.LName}%");
        }

        if (!string.IsNullOrWhiteSpace(filter.UserName))
        {
            whereParts.Add("u.UserName LIKE @UserName");
            parameters.Add("UserName", $"%{filter.UserName}%");
        }

        if (!string.IsNullOrWhiteSpace(filter.Email))
        {
            whereParts.Add("u.Email LIKE @Email");
            parameters.Add("Email", $"%{filter.Email}%");
        }

        if (!string.IsNullOrWhiteSpace(filter.PhoneNumber))
        {
            whereParts.Add("u.PhoneNumber LIKE @PhoneNumber");
            parameters.Add("PhoneNumber", $"%{filter.PhoneNumber}%");
        }

        if (!string.IsNullOrWhiteSpace(filter.RoleCode))
        {
            whereParts.Add("r.Code = @RoleCode");
            parameters.Add("RoleCode", filter.RoleCode);
        }

        string whereClause = string.Join(" AND ", whereParts);

        string querySql = $"""
            SELECT 
                u.Code, u.FName, u.LName, u.Email, u.UserName, u.PhoneNumber,
                r.Code AS RoleCode, r.Name AS RoleName,
                u.CreatedAt, u.UpdatedAt
            FROM "Users" u
            INNER JOIN Roles r ON u.RoleId = r.RoleId
            WHERE {whereClause}
            ORDER BY u.CreatedAt DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
            """;

        string countSql = $"""
            SELECT COUNT(*)
            FROM Users u
            INNER JOIN Roles r ON u.RoleId = r.RoleId
            WHERE {whereClause}
            """;

        parameters.Add("Offset", (filter.PageNumber - 1) * filter.PageSize);
        parameters.Add("PageSize", filter.PageSize);

        using var multi = await conn.QueryMultipleAsync(querySql + ";" + countSql, parameters);

        var items = (await multi.ReadAsync<UserDto>()).ToList();
        var totalCount = await multi.ReadSingleAsync<int>();

        return new PagedResult<UserDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }
}
