using AlooGiyah_Application.DTOs.Auction;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Store
{
    public interface IAuctionService
    {
        Task<AuctionDto> CreateAsync(AuctionCreateDto dto);
        Task<bool> UpdateAsync(AuctionUpdateDto dto);
        Task<bool> DeleteAsync(string code);
        Task<AuctionDto?> GetByCodeAsync(string code);
        Task<PagedResult<AuctionDto>> GetByFilterAsync(AuctionFilterDto filter);
        Task<bool> FinalizeAuctionAsync(string code);
    }
}
