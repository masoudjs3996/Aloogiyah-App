using AlooGiyah_Application.DTOs.AuctionBid;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service.Store
{
    public interface IAuctionBidService
    {
        Task<AuctionBidDto> CreateAsync(AuctionBidCreateDto dto);
        Task<bool> UpdateAsync(AuctionBidUpdateDto dto);
        Task<bool> DeleteAsync(string code);
        Task<AuctionBidDto?> GetByCodeAsync(string code);
        Task<PagedResult<AuctionBidDto>> GetByFilterAsync(AuctionBidFilterDto filter);
    }
}
