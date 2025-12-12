using AlooGiyah_Application.DTOs.BaseDto;
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Category
{
    public class CategoryFilterDto : BaseFilterDto
    {
        public string? SearchTerm { get; set; }
        public string? ParentCategoryCode { get; set; }

        public string StatusCode { get; set; } = string.Empty;
        public string statusName { get; set; } = string.Empty;
        public int? SortOrder { get; set; }
    }
}
