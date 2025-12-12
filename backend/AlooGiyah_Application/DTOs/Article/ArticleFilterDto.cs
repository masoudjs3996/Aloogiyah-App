
using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.Article;

public class ArticleFilterDto : BaseFilterDto
{
    public string? SearchTerm { get; set; }
    public string? AuthorCode { get; set; }
    public string? CategoryCode { get; set; }
}
