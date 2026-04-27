using AlooGiyah_Application.DTOs.BaseDto;
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.Comment;

public class CommentTreeFilterDto : BaseFilterDto
{
    public string? EntityCode { get; set; }

    public EntityComment? EntityComment { get; set; }

   
}
