using AlooGiyah_Application.DTOs.AuctionBid;

namespace AlooGiyah_Application.DTOs.Auction;

public class AuctionDto
{
    public string Code { get; set; } = string.Empty;
    public string AgriculturalProductCode { get; set; } = string.Empty;
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset EndDate { get; set; }
    public decimal StartingPrice { get; set; }
    public decimal? CurrentPrice { get; set; }
    public string? WinnerCode { get; set; }
    public string StatusCode { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public List<AuctionBidDto> Bids { get; set; } = new();
}
