using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Article
{
    public class ArticleUpdateDto
    {
        public string ArticleCode { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public List<string> CategoryCodes { get; set; } = new();

        public string Slug { get; set; } = string.Empty;
        public string MetaTitle { get; set; } = string.Empty;
        public string MetaDescription { get; set; } = string.Empty;
        public string? MetaKeywords { get; set; }
    }
}
