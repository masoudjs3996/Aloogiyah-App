using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class Comment : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int CommentId { get; set; }

    [Required, MaxLength(1000)]
    public string Content { get; set; } = string.Empty;

    [Required]
    public int UserId { get; set; }

    [Required]
    public int StatusId { get; set; }

    public int? ParentCommentId { get; set; }

    [Range(1, 5)]
    public int? Rating { get; set; }

    [Required]
    public required string EntityCode { get; set; }

    [Required]
    public EntityComment EntityComment { get; set; }
    #endregion

    #region Relations

    [ForeignKey(nameof(StatusId))]
    public Status Status { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [ForeignKey(nameof(ParentCommentId))]
    public Comment? ParentComment { get; set; }

    public List<Comment> SubComments { get; set; } = new List<Comment>();
    #endregion
}
