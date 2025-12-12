using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class FileType : BaseEntity
{
    #region Properties
    [Key]
    public int FileTypeId { get; set; }
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }
    #endregion

    #region Relations
    public List<Files> Files { get; set; } = null!;
    #endregion
}