using AlooGiyah_Application.DTOs.Farm;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using Dapper;
using System.Text;

namespace AlooGiyah_Persistence.Queries;

public class FarmQuery : BaseQuery, IFarmQuery
{
    public FarmQuery(IDbConnectionFactory connectionFactory)
        : base(connectionFactory)
    {
    }

    public async Task<PagedResult<FarmListDto>> GetByFilterAsync(FarmFilterDto filter)
    {
        var parameters = new DynamicParameters();

        var where = new StringBuilder();
        where.AppendLine("WHERE 1=1");

        where.AppendLine("AND f.\"IsDeleted\" = FALSE");

        if (!string.IsNullOrWhiteSpace(filter.Name))
        {
            where.AppendLine("AND f.\"Name\" ILIKE @Name");
            parameters.Add("Name", $"%{filter.Name}%");
        }

        if (!string.IsNullOrWhiteSpace(filter.UserCode))
        {
            where.AppendLine("AND u.\"Code\" = @UserCode");
            parameters.Add("UserCode", filter.UserCode);
        }

        parameters.Add("FarmEntity", (int)EntityFile.Farm);
        parameters.Add("UserEntity", (int)EntityFile.Profile);

        var baseSql = @"
SELECT
    f.""Code"" AS ""FarmCode"",
    f.""Name"" AS ""FarmName"",
    f.""Description"" AS ""Description"",

    u.""Code"" AS ""UserCode"",
    CONCAT(u.""FName"", ' ', COALESCE(u.""LName"", '')) AS ""UserFullName"",

    farmFile.""Url"" AS ""FarmImageUrl"",
    userFile.""Url"" AS ""UserImageUrl""
FROM ""Farms"" f
INNER JOIN ""Users"" u ON u.""UserId"" = f.""OwnerId""
LEFT JOIN ""Files"" farmFile ON farmFile.""EntityCode"" = f.""Code"" AND farmFile.""EntityFile"" = @FarmEntity AND farmFile.""IsPrimary"" = TRUE
LEFT JOIN ""Files"" userFile ON userFile.""EntityCode"" = u.""Code"" AND userFile.""EntityFile"" = @UserEntity AND userFile.""IsPrimary"" = TRUE
";
        var countSql = @"
SELECT COUNT(*)
FROM ""Farms"" f
INNER JOIN ""Users"" u ON u.""UserId"" = f.""OwnerId""
";

        return await QueryPagedAsync<FarmListDto>(
            baseSql + where,
            countSql + where,
            parameters,
            filter.PageNumber,
            filter.PageSize);
    }
}