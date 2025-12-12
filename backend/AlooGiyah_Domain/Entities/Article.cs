using AlooGiyah_Domain.Entities.UserFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class Article : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ArticleId { get; set; }

    [Required]
    public int AuthorId { get; set; }

    [Required]
    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(4000)]
    public string Content { get; set; } = string.Empty;



    [MaxLength(255)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(255)]
    public string MetaTitle { get; set; } = string.Empty;

    [MaxLength(500)]
    public string MetaDescription { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? MetaKeywords { get; set; }

    #endregion

    #region Relations

    [ForeignKey(nameof(AuthorId))]
    public User Author { get; set; } = null!;
    public List<Category> Categories { get; set; } = null!;
    #endregion
}   