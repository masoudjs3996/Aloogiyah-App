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

        if (!string.IsNullOrWhiteSpace(filter.StatusCode))
        {
            where.AppendLine("AND s.\"Code\" = @StatusCode");
            parameters.Add("StatusCode", filter.StatusCode);
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
INNER JOIN ""Statuses"" s ON s.""StatusId"" = f.""StatusId""

LEFT JOIN ""Files"" farmFile
    ON farmFile.""EntityCode"" = f.""Code""
    AND farmFile.""EntityFile"" = @FarmEntity
    AND farmFile.""IsPrimary"" = TRUE

LEFT JOIN ""Files"" userFile
    ON userFile.""EntityCode"" = u.""Code""
    AND userFile.""EntityFile"" = @UserEntity
    AND userFile.""IsPrimary"" = TRUE
";

        var countSql = @"
SELECT COUNT(*)
FROM ""Farms"" f
INNER JOIN ""Users"" u ON u.""UserId"" = f.""OwnerId""
INNER JOIN ""Statuses"" s ON s.""StatusId"" = f.""StatusId""
";

        return await QueryPagedAsync<FarmListDto>(
            baseSql + where,
            countSql + where,
            parameters,
            filter.PageNumber,
            filter.PageSize);
    }

    public async Task<PagedResult<MyFarmlistDto>> GetMyFarmsAsync(GetMyFarmDto filter, int currentUserId)
    {
        var whereParts = new List<string>
        {
            "f.\"IsDeleted\" = false",
            "f.\"OwnerId\" = @OwnerId"
        };

        var parameters = new DynamicParameters();
        parameters.Add("OwnerId", currentUserId);
        parameters.Add("FarmEntity", (int)EntityFile.Farm);

        if (!string.IsNullOrWhiteSpace(filter.Name))
        {
            whereParts.Add("f.\"Name\" ILIKE @Name");
            parameters.Add("Name", $"%{filter.Name}%");
        }

        if (!string.IsNullOrWhiteSpace(filter.AddressCode))
        {
            whereParts.Add("(prov.\"Code\" = @AddressCode OR county.\"Code\" = @AddressCode)");
            parameters.Add("AddressCode", filter.AddressCode);
        }

        var whereClause = string.Join(" AND ", whereParts);

        var baseSql = $"""
            SELECT
                f."Code" AS "Code",
                f."Name" AS "Name",
                f."Description" AS "Description",
                f."Capacity" AS "Capacity",
                
                COALESCE(prov."Name", '') AS "ProvinceName",
                COALESCE(county."Name", '') AS "CountyName",
                
                COALESCE(farmFile."Url", '') AS "FarmImageUrl",
                
                COALESCE(s."Code", '') AS "StatusCode",
                COALESCE(s."Name", '') AS "StatusName",
                
                (
                    SELECT ap."Name"
                    FROM "AgriculturalProducts" ap
                    WHERE ap."FarmId" = f."FarmId"
                        AND ap."IsDeleted" = FALSE
                    ORDER BY ap."CreatedAt" ASC, ap."AgriculturalProductId" ASC
                    LIMIT 1
                ) AS "FirstProductName"
                
            FROM "Farms" f
            LEFT JOIN "Addresses" addr ON addr."AddressId" = f."AddressId"
            LEFT JOIN "Provinces" prov ON prov."ProvinceId" = addr."ProvinceId"
            LEFT JOIN "Countys" county ON county."CountyId" = addr."CountyId"
            LEFT JOIN "Statuses" s ON s."StatusId" = f."StatusId"
            LEFT JOIN "Files" farmFile
                ON farmFile."EntityCode" = f."Code"
                AND farmFile."EntityFile" = @FarmEntity
                AND farmFile."IsPrimary" = TRUE
                AND farmFile."IsDeleted" = FALSE
            WHERE {whereClause}
            """;

        var countSql = $"""
            SELECT COUNT(*)
            FROM "Farms" f
            LEFT JOIN "Addresses" addr ON addr."AddressId" = f."AddressId"
            LEFT JOIN "Provinces" prov ON prov."ProvinceId" = addr."ProvinceId"
            LEFT JOIN "Countys" county ON county."CountyId" = addr."CountyId"
            WHERE {whereClause}
            """;

        var orderBy = "ORDER BY f.\"CreatedAt\" DESC";
        baseSql += "\n" + orderBy;

        return await QueryPagedAsync<MyFarmlistDto>(
            baseSql,
            countSql,
            parameters,
            filter.PageNumber,
            filter.PageSize);
    }
}