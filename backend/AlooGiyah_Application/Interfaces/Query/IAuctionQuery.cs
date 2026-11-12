using AlooGiyah_Application.DTOs.Auction;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IAuctionQuery
{
    Task<AuctionDto?> GetByCodeAsync(string code);
    Task<PagedResult<AuctionDto>> GetByFilterAsync(AuctionFilterDto filter);
}
