using AlooGiyah_Application.DTOs.Location;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Persistence.Queries;
public class LocationQuery : BaseQuery, ILocationQuery
{
    public LocationQuery(IDbConnectionFactory factory) : base(factory) { }

    public Task<PagedResult<ProvinceListDto>> GetProvincesAsync(LocationFilterDto filter)
    {
        var where = new QueryFilter();
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm)) where.Add("(strpos(t.\"Name\",@Search)>0 OR strpos(t.\"Code\",@Search)>0)", "Search", filter.SearchTerm);
        if (!string.IsNullOrWhiteSpace(filter.StatusCode))
        { where.Equal("s.\"Code\"", "Status", filter.StatusCode); where.Equal("s.\"EntityStatus\"", "Entity", (int)EntityStatus.Location); }
        return QueryJsonPagedAsync<ProvinceListDto>("""
to_jsonb(t) || jsonb_build_object('StatusCode', s."Code", 'StatusName', s."Name")
""",
            """
FROM "Provinces" t LEFT JOIN "Statuses" s ON s."StatusId"=t."StatusId"
""", where, "t.\"Name\", t.\"ProvinceId\"", filter.PageNumber, filter.PageSize);
    }
    public async Task<PagedResult<CountyDto>> GetCountiesAsync(string? provinceCode, LocationFilterDto filter)
    {
        var where = new QueryFilter();
        if (!string.IsNullOrWhiteSpace(provinceCode))
        {
            if (!await ExecuteScalarAsync<bool>("SELECT EXISTS(SELECT 1 FROM \"Provinces\" WHERE \"Code\"=@Code AND NOT \"IsDeleted\")", new { Code = provinceCode })) throw new NotFoundException("استان یافت نشد.");
            where.Equal("p.\"Code\"", "Province", provinceCode);
        }
        where.Contains("t.\"Name\"", "Search", filter.SearchTerm);
        where.Equal("s.\"Code\"", "Status", filter.StatusCode);
        return await QueryJsonPagedAsync<CountyDto>("""
to_jsonb(t) || jsonb_build_object('ProvinceCode', p."Code", 'ProvinceName', p."Name", 'StatusCode', s."Code", 'StatusName', s."Name")
""",
            """
FROM "Countys" t JOIN "Provinces" p ON p."ProvinceId"=t."ProvinceId" LEFT JOIN "Statuses" s ON s."StatusId"=t."StatusId"
""", where, "t.\"Name\", t.\"CountyId\"", filter.PageNumber, filter.PageSize);
    }
    public async Task<List<CountyLocationItemDto>> GetCountyLocationsAsync(CountyLocationsFilterDto filter)
    {
        var county = await ExecuteScalarAsync<int?>("SELECT \"CountyId\" FROM \"Countys\" WHERE \"Code\"=@Code AND NOT \"IsDeleted\"", new { Code = filter.countyCode }) ?? throw new NotFoundException("شهرستان یافت نشد.");
        return await QueryJsonAsync<CountyLocationItemDto>("""
SELECT data::text FROM (
SELECT to_jsonb(t) || jsonb_build_object('Type', 'City', 'StatusCode', s."Code", 'StatusName', s."Name") AS data, t."Name" AS name, t."CityId" AS id FROM "Citys" t LEFT JOIN "Statuses" s ON s."StatusId"=t."StatusId" WHERE NOT t."IsDeleted" AND t."CountyId"=@County AND @Cities
UNION ALL
SELECT to_jsonb(t) || jsonb_build_object('Type', 'Village', 'StatusCode', s."Code", 'StatusName', s."Name") AS data, t."Name" AS name, t."VillageId" AS id FROM "Villages" t LEFT JOIN "Statuses" s ON s."StatusId"=t."StatusId" WHERE NOT t."IsDeleted" AND t."CountyId"=@County AND @Villages
) locations ORDER BY name, id
""", new { County = county, Cities = filter.IncludeVillages != true, Villages = filter.IncludeVillages != false });
    }
}
