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


    private const string ListFrom = """
FROM "Farms" t JOIN "Users" u ON u."UserId"=t."OwnerId" JOIN "Statuses" s ON s."StatusId"=t."StatusId" LEFT JOIN "Addresses" a ON a."AddressId"=t."AddressId" LEFT JOIN "Provinces" prov ON prov."ProvinceId"=a."ProvinceId" LEFT JOIN "Countys" county ON county."CountyId"=a."CountyId"
""";
    public Task<PagedResult<FarmListDto>> GetByFilterAsync(FarmFilterDto filter)
    {
        var where = new QueryFilter(); where.Contains("t.\"Name\"", "Name", filter.Name); where.Equal("u.\"Code\"", "User", filter.UserCode); where.Equal("s.\"Code\"", "Status", filter.StatusCode);
        if (!string.IsNullOrWhiteSpace(filter.AddressCode)) where.Add("(prov.\"Code\"=@Address OR county.\"Code\"=@Address OR a.\"Code\"=@Address)", "Address", filter.AddressCode);
        return QueryJsonPagedAsync<FarmListDto>("""
to_jsonb(t) || jsonb_build_object('FarmCode', t."Code", 'FarmName', t."Name", 'UserCode', u."Code", 'UserFullName', concat_ws(' ',u."FName",u."LName"), 'FarmImageUrl', (SELECT fi."Url" FROM "Files" fi WHERE fi."EntityCode"=t."Code" AND fi."EntityFile"=6 AND fi."IsPrimary" AND NOT fi."IsDeleted" ORDER BY fi."CreatedAt" DESC, fi."FileId" DESC LIMIT 1), 'UserImageUrl', (SELECT fi."Url" FROM "Files" fi WHERE fi."EntityCode"=u."Code" AND fi."EntityFile"=0 AND fi."IsPrimary" AND NOT fi."IsDeleted" ORDER BY fi."CreatedAt" DESC, fi."FileId" DESC LIMIT 1))
""", ListFrom, where, "t.\"CreatedAt\" DESC,t.\"FarmId\" DESC", filter.PageNumber, filter.PageSize);
    }
    public Task<PagedResult<MyFarmlistDto>> GetMyFarmsAsync(GetMyFarmDto filter, int currentUserId)
    {
        var where = new QueryFilter(); where.Add("t.\"OwnerId\"=@Owner", "Owner", currentUserId); where.Contains("t.\"Name\"", "Name", filter.Name);
        if (!string.IsNullOrWhiteSpace(filter.AddressCode)) where.Add("(prov.\"Code\"=@Address OR county.\"Code\"=@Address)", "Address", filter.AddressCode);
        return QueryJsonPagedAsync<MyFarmlistDto>("""
to_jsonb(t) || jsonb_build_object('ProvinceName', COALESCE(prov."Name",''), 'CountyName', COALESCE(county."Name",''), 'FarmImageUrl', COALESCE((SELECT fi."Url" FROM "Files" fi WHERE fi."EntityCode"=t."Code" AND fi."EntityFile"=6 AND fi."IsPrimary" AND NOT fi."IsDeleted" ORDER BY fi."CreatedAt" DESC, fi."FileId" DESC LIMIT 1),''), 'StatusCode', s."Code", 'StatusName', s."Name", 'FirstProductName', (SELECT p."Name" FROM "AgriculturalProducts" p WHERE p."FarmId"=t."FarmId" AND NOT p."IsDeleted" ORDER BY p."CreatedAt",p."AgriculturalProductId" LIMIT 1))
""", ListFrom, where, "t.\"CreatedAt\" DESC,t.\"FarmId\" DESC", filter.PageNumber, filter.PageSize);
    }
    public Task<FarmDto?> GetByCodeAsync(string code) => QueryJsonFirstAsync<FarmDto>("""
SELECT (to_jsonb(t) || jsonb_build_object('OwnerCode', u."Code", 'ImageUrl', (SELECT fi."Url" FROM "Files" fi WHERE fi."EntityCode"=t."Code" AND fi."EntityFile"=6 AND fi."IsPrimary" AND NOT fi."IsDeleted" ORDER BY fi."CreatedAt" DESC, fi."FileId" DESC LIMIT 1), 'Address', CASE WHEN a."AddressId" IS NULL THEN NULL ELSE to_jsonb(a) || jsonb_build_object('UserCode', u."Code", 'ProvinceCode', prov."Code", 'ProvinceName', prov."Name", 'CountyCode', county."Code", 'CountyName', county."Name", 'CityCode', city."Code", 'CityName', city."Name", 'VillageCode', v."Code", 'VillageName', v."Name") END))::text FROM "Farms" t JOIN "Users" u ON u."UserId"=t."OwnerId" LEFT JOIN "Addresses" a ON a."AddressId"=t."AddressId"
LEFT JOIN "Provinces" prov ON prov."ProvinceId"=a."ProvinceId" LEFT JOIN "Countys" county ON county."CountyId"=a."CountyId"
LEFT JOIN "Citys" city ON city."CityId"=a."CityId" LEFT JOIN "Villages" v ON v."VillageId"=a."VillageId" WHERE NOT t."IsDeleted" AND t."Code"=@Code
""", new { Code = code });
}
