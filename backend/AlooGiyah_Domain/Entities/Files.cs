using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class Files : BaseEntity
{
    #region Properties
    [Key]
    public int FileId { get; set; }

    [Required]
    public int FileTypeId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Url { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public EntityFile EntityFile { get; set; }

    [MaxLength(12)]
    public string? EntityCode { get; set; }

    public bool IsPrimary { get; set; } = false;
    #endregion

    #region Relations
    [ForeignKey(nameof(FileTypeId))]
    public FileType FileType { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
    #endregion
}