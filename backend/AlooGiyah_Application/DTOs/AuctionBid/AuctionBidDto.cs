namespace AlooGiyah_Application.DTOs.AuctionBid;

public class AuctionBidDto
{
    public string Code { get; set; } = string.Empty;
    public decimal BidAmount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
