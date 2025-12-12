using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Auction;

public class AuctionUpdateDto
{
    [Required]
    public string Code { get; set; } = string.Empty;

    [Required]
    public string StatusCode { get; set; } = string.Empty;

    public string? WinnerCode { get; set; }
}
