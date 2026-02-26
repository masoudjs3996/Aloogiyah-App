
namespace AlooGiyah_Application.DTOs.Category;

public class CategoryFeaturedDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty; // حتماً عکس داره
    public string? Icon { get; set; }
    public string StatusCode { get; set; } = string.Empty;
    public string statusName { get; set; } = string.Empty;
    public int? SortOrder { get; set; }
    public string Slug { get; set; } = string.Empty;
}
