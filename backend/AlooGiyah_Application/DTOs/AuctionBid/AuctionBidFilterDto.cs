using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.AuctionBid;

public class AuctionBidFilterDto : BaseFilterDto
{
    public string? AuctionCode { get; set; }
    public decimal? MinBidAmount { get; set; }
    public decimal? MaxBidAmount { get; set; }
    public string? UserCode { get; set; }

}
