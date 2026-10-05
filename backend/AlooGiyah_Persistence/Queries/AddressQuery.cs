using AlooGiyah_Application.DTOs.Address;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Persistence.Queries;
public class AddressQuery : BaseQuery, IAddressQuery
{
    private readonly ICurrentUserService _user;
    public AddressQuery(IDbConnectionFactory factory, ICurrentUserService user) : base(factory) { _user = user; }

    private const string Projection = """
to_jsonb(t) || jsonb_build_object('UserCode', u."Code", 'ProvinceCode', prov."Code", 'ProvinceName', prov."Name", 'CountyCode', county."Code", 'CountyName', county."Name", 'CityCode', city."Code", 'CityName', city."Name", 'VillageCode', v."Code", 'VillageName', v."Name")
""";
    private const string From = """
FROM "Addresses" t LEFT JOIN "Users" u ON u."UserId"=t."UserId"
LEFT JOIN "Provinces" prov ON prov."ProvinceId"=t."ProvinceId"
LEFT JOIN "Countys" county ON county."CountyId"=t."CountyId"
LEFT JOIN "Citys" city ON city."CityId"=t."CityId"
LEFT JOIN "Villages" v ON v."VillageId"=t."VillageId"
""";
    private QueryFilter Filter()
    { var where = new QueryFilter(); QueryAccess.UserId(_user); QueryAccess.Owner(where, _user, "t.\"UserId\""); return where; }
    public Task<AddressDto?> GetByCodeAsync(string code)
    { var where = Filter(); where.Add("t.\"Code\"=@Code", "Code", code);
       return QueryJsonFirstAsync<AddressDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters); }
    public Task<PagedResult<AddressDto>> GetByFilterAsync(AddressFilterDto filter)
    {
        var where = Filter();
        where.Contains("t.\"PostalCode\"", "PostalCode", filter.PostalCode);
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm)) where.Add("""
(strpos(t."Street",@Search)>0 OR strpos(prov."Name",@Search)>0 OR strpos(county."Name",@Search)>0 OR strpos(city."Name",@Search)>0 OR strpos(v."Name",@Search)>0)
""", "Search", filter.SearchTerm);
        return QueryJsonPagedAsync<AddressDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"AddressId\" DESC", filter.PageNumber, filter.PageSize);
    }
}
