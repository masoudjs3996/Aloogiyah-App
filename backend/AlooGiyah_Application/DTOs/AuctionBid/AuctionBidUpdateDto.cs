
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.AuctionBid;

public class AuctionBidUpdateDto
{
    [Required]
    public string Code { get; set; } = string.Empty;

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal BidAmount { get; set; }
}
