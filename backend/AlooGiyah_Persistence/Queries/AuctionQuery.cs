using AlooGiyah_Application.DTOs.Auction;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
namespace AlooGiyah_Persistence.Queries;
public class AuctionQuery : BaseQuery, IAuctionQuery
{
    private readonly ICurrentUserService _currentUser;
    public AuctionQuery(IDbConnectionFactory factory, ICurrentUserService currentUser) : base(factory)
    { _currentUser = currentUser; }
    private const string Projection = """
to_jsonb(t) || jsonb_build_object('AgriculturalProductCode', p."Code", 'StatusCode', s."Code", 'WinnerCode', u."Code", 'Bids', COALESCE((SELECT jsonb_agg(to_jsonb(b) ORDER BY b."CreatedAt", b."AuctionBidId") FROM "AuctionBids" b WHERE b."AuctionId" = t."AuctionId" AND NOT b."IsDeleted"), '[]'::jsonb))
""";
    private const string From = """
FROM "Auctions" t LEFT JOIN "AgriculturalProducts" p ON p."AgriculturalProductId" = t."AgriculturalProductId" LEFT JOIN "Statuses" s ON s."StatusId" = t."StatusId" LEFT JOIN "Users" u ON u."UserId" = t."WinnerId"
""";
    private QueryFilter BaseFilter()
    {
        var where = new QueryFilter();
        
        
        return where;
    }
    public Task<AuctionDto?> GetByCodeAsync(string code)
    {
        var where = BaseFilter(); where.Add("t.\"Code\" = @Code", "Code", code);
        return QueryJsonFirstAsync<AuctionDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters);
    }
    public Task<PagedResult<AuctionDto>> GetByFilterAsync(AuctionFilterDto filter)
    {
        var where = BaseFilter();
        where.Equal("""
p."Code"
""", "ProductCode", filter.ProductCode);
        where.Equal("""
s."Code"
""", "StatusCode", filter.StatusCode);
        where.Equal("""
u."Code"
""", "WinnerCode", filter.WinnerCode);
        where.Compare("""
t."StartDate"
""", ">=", "StartDateFrom", filter.StartDateFrom);
        where.Compare("""
t."StartDate"
""", "<=", "StartDateTo", filter.StartDateTo);
        where.Compare("""
t."EndDate"
""", ">=", "EndDateFrom", filter.EndDateFrom);
        where.Compare("""
t."EndDate"
""", "<=", "EndDateTo", filter.EndDateTo);
        where.Compare("""
t."StartingPrice"
""", ">=", "MinStartingPrice", filter.MinStartingPrice);
        where.Compare("""
t."StartingPrice"
""", "<=", "MaxStartingPrice", filter.MaxStartingPrice);
        return QueryJsonPagedAsync<AuctionDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"AuctionId\" DESC", filter.PageNumber, filter.PageSize);
    }
}
