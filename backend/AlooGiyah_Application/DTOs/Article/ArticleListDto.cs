
namespace AlooGiyah_Application.DTOs.Article;

public class ArticleListDto
{
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string AuthorCode { get; set; } = string.Empty;
    public List<string> CategoryCodes { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public string Slug { get; set; } = string.Empty;
}
