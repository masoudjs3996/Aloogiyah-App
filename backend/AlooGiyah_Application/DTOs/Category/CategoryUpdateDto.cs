using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Category
{
    public class CategoryUpdateDto
    {
        [Required]
        public required string CategoryCode { get; set; }

        [Required, MaxLength(255)]
        public required string Name { get; set; }

        public string? ParentCategoryCode { get; set; }

        [MaxLength(255)]
        public string Slug { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Icon { get; set; }

        [MaxLength(255)]
        public string MetaTitle { get; set; } = string.Empty;

        [MaxLength(500)]
        public string MetaDescription { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? MetaKeywords { get; set; }

        [MaxLength(10)]
        public string StatusCode { get; set; } = string.Empty;
        public int? SortOrder { get; set; }
    }
}
