namespace AlooGiyah_Application.DTOs.Category;

public class CategoryDto
{

    public string Code { get; set; } = string.Empty; 
    public string Name { get; set; } = string.Empty;
    public string? ParentCategoryCode { get; set; }
    public string? ImageUrl { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string MetaTitle { get; set; } = string.Empty;
    public string MetaDescription { get; set; } = string.Empty;
    public string? MetaKeywords { get; set; } = string.Empty;
    public string StatusCode { get; set; } = string.Empty;
    public string statusName { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public List<CategoryDto>? SubCategories { get; set; } = new List<CategoryDto>();
}
