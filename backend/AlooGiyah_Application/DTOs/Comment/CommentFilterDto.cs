using AlooGiyah_Application.DTOs.BaseDto;
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.Comment;

public class CommentFilterDto : BaseFilterDto
{
    public string? EntityCode { get; set; }
    public EntityComment? EntityComment { get; set; }
    public int? MinRating { get; set; }
    public int? MaxRating { get; set; }
    public string? StatusCode { get; set; }
    public DateTimeOffset? StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }

}
