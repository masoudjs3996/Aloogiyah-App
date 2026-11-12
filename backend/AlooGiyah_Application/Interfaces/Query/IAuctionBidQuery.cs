using AlooGiyah_Application.DTOs.AuctionBid;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IAuctionBidQuery
{
    Task<AuctionBidDto?> GetByCodeAsync(string code);
    Task<PagedResult<AuctionBidDto>> GetByFilterAsync(AuctionBidFilterDto filter);
}
