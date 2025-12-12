using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using AlooGiyah_Domain.Entities.Store;

namespace AlooGiyah_Domain.Entities;

public class Category : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int CategoryId { get; set; }

    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    public int? ParentCategoryId { get; set; }


    public int SortOrder { get; set; } = 0; // برای ترتیب نمایش در صفحه اصلی

    [MaxLength(255)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(255)]
    public string MetaTitle { get; set; } = string.Empty;

    [MaxLength(500)]
    public string MetaDescription { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? MetaKeywords { get; set; }

    public int? StatusId { get; set; }
    #endregion

    #region Relations
    [ForeignKey(nameof(ParentCategoryId))]
    public Category? ParentCategory { get; set; }

    [ForeignKey(nameof(StatusId))]
    public Status? Status { get; set; } 
    
    public List<Category>? SubCategories { get; set; }
    public List<Product>? Products { get; set; } 
    public List<Article>? Articles { get; set; } 
    public List<AgriculturalProduct>? AgriculturalProducts { get; set; } 
    #endregion
}