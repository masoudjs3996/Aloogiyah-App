using AlooGiyah_Application.DTOs.ServiceRequest;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
namespace AlooGiyah_Persistence.Queries;
public class ServiceRequestQuery : BaseQuery, IServiceRequestQuery
{
    private readonly ICurrentUserService _currentUser;
    public ServiceRequestQuery(IDbConnectionFactory factory, ICurrentUserService currentUser) : base(factory)
    { _currentUser = currentUser; }
    private const string Projection = """
to_jsonb(t) || jsonb_build_object('UserCode', u."Code", 'ProviderCode', p."Code", 'StatusCode', s."Code", 'DiscountCode', d."Code", 'ServiceDate', t."servicedate", 'AddressCode', a."Code", 'AddressStreet', a."Street", 'AddressProvince', prov."Name", 'AddressCounty', county."Name", 'AddressCity', COALESCE(city."Name", village."Name"))
""";
    private const string From = """
FROM "ServiceRequests" t LEFT JOIN "Users" u ON u."UserId" = t."UserId" LEFT JOIN "Users" p ON p."UserId" = t."ProviderId" LEFT JOIN "Statuses" s ON s."StatusId" = t."StatusId" LEFT JOIN "Discounts" d ON d."DiscountId" = t."DiscountId" LEFT JOIN "Addresses" a ON a."AddressId" = t."AddressId" LEFT JOIN "Provinces" prov ON prov."ProvinceId" = a."ProvinceId" LEFT JOIN "Countys" county ON county."CountyId" = a."CountyId" LEFT JOIN "Citys" city ON city."CityId" = a."CityId" LEFT JOIN "Villages" village ON village."VillageId" = a."VillageId"
""";
    private QueryFilter BaseFilter()
    {
        var where = new QueryFilter();
        QueryAccess.UserId(_currentUser);
        if (!QueryAccess.IsManager(_currentUser)) where.Add("(t.\"UserId\" = @CurrentUserId OR t.\"ProviderId\" = @CurrentUserId)", "CurrentUserId", QueryAccess.UserId(_currentUser));
        
        return where;
    }
    public Task<ServiceRequestDto?> GetByCodeAsync(string code)
    {
        var where = BaseFilter(); where.Add("t.\"Code\" = @Code", "Code", code);
        return QueryJsonFirstAsync<ServiceRequestDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters);
    }
    public Task<PagedResult<ServiceRequestDto>> GetPagedAsync(ServiceRequestFilterDto filter)
    {
        var where = BaseFilter();
        where.Equal("""
u."Code"
""", "UserCode", filter.UserCode);
        where.Equal("""
t."Code"
""", "Code", filter.Code);
        where.Equal("""
s."Code"
""", "StatusCode", filter.StatusCode);
        where.Equal("""
t."ServiceType"
""", "ServiceType", filter.ServiceType);
        return QueryJsonPagedAsync<ServiceRequestDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"ServiceRequestId\" DESC", filter.PageNumber, filter.PageSize);
    }
}
