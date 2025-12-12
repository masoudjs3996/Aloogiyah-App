using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.Auction;

public class AuctionFilterDto : BaseFilterDto
{
    public string? ProductCode { get; set; }
    public string? StatusCode { get; set; }
    public string? WinnerCode { get; set; }
    public DateTimeOffset? StartDateFrom { get; set; }
    public DateTimeOffset? StartDateTo { get; set; }
    public DateTimeOffset? EndDateFrom { get; set; }
    public DateTimeOffset? EndDateTo { get; set; }
    public decimal? MinStartingPrice { get; set; }
    public decimal? MaxStartingPrice { get; set; }
}