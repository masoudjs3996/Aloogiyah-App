
namespace AlooGiyah_Application.DTOs.Category;

public class CategoryListDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ParentCategoryCode { get; set; }
    public string? ImageUrl { get; set; }
    public string? Icon { get; set; }
    public string Slug { get; set; } = string.Empty;
}
