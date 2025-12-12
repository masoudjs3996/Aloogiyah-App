using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class StatusChangeLog : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int StatusChangeLogId { get; set; }

    [Required]
    public int EntityId { get; set; }

    [Required]
    [MaxLength(50)]
    public EntityStatus EntityStatus { get; set; } 

    [MaxLength(1000)]
    public string? Comments { get; set; }
    [Required]
    public int OldStatusId { get; set; }

    [Required]
    public int NewStatusId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public DateTimeOffset ChangeDate { get; set; } = DateTime.UtcNow;
    #endregion

    #region Relations

    [ForeignKey(nameof(OldStatusId))]
    public Status OldStatus { get; set; } = null!;

    [ForeignKey(nameof(NewStatusId))]
    public Status NewStatus { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
    #endregion
}