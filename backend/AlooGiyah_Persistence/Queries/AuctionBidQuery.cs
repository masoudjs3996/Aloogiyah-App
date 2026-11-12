using AlooGiyah_Application.DTOs.AuctionBid;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
namespace AlooGiyah_Persistence.Queries;
public class AuctionBidQuery : BaseQuery, IAuctionBidQuery
{
    private readonly ICurrentUserService _currentUser;
    public AuctionBidQuery(IDbConnectionFactory factory, ICurrentUserService currentUser) : base(factory)
    { _currentUser = currentUser; }
    private const string Projection = """
to_jsonb(t)
""";
    private const string From = """
FROM "AuctionBids" t LEFT JOIN "Auctions" a ON a."AuctionId" = t."AuctionId" LEFT JOIN "Users" u ON u."UserId" = t."UserId"
""";
    private QueryFilter BaseFilter()
    {
        var where = new QueryFilter();
        QueryAccess.Owner(where, _currentUser, """
t."UserId"
""");
        
        return where;
    }
    public Task<AuctionBidDto?> GetByCodeAsync(string code)
    {
        var where = BaseFilter(); where.Add("t.\"Code\" = @Code", "Code", code);
        return QueryJsonFirstAsync<AuctionBidDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters);
    }
    public Task<PagedResult<AuctionBidDto>> GetByFilterAsync(AuctionBidFilterDto filter)
    {
        var where = BaseFilter();
        where.Equal("""
a."Code"
""", "AuctionCode", filter.AuctionCode);
        where.Equal("""
u."Code"
""", "UserCode", filter.UserCode);
        where.Compare("""
t."BidAmount"
""", ">=", "MinBidAmount", filter.MinBidAmount);
        where.Compare("""
t."BidAmount"
""", "<=", "MaxBidAmount", filter.MaxBidAmount);
        return QueryJsonPagedAsync<AuctionBidDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"AuctionBidId\" DESC", filter.PageNumber, filter.PageSize);
    }
}
