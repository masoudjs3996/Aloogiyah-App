using AlooGiyah_Domain.Enums;


namespace AlooGiyah_Application.DTOs.Comment;

public class CommentDto
{
    public string Code { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string UserCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int? Rating { get; set; }
    public int? ParentId { get; set; }
    public string? ParentCode { get; set; }
    public string EntityCode { get; set; } = string.Empty;
    public string StatusCode {  get; set; } = string.Empty;
    public EntityComment EntityComment { get; set; } 
    public DateTimeOffset CreatedAt { get; set; }
    public List<CommentDto> SubComments { get; set; } = new List<CommentDto>();
}
