using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Auction;

public class AuctionCreateDto
{
    [Required]
    public string AgriculturalProductCode { get; set; } = string.Empty;

    [Required]
    public DateTimeOffset StartDate { get; set; }

    [Required]
    public DateTimeOffset EndDate { get; set; }

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal StartingPrice { get; set; }

    [Required]
    public string StatusCode { get; set; } = string.Empty;
}
