using AlooGiyah_Domain.Entities.UserFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class Notification : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int NotificationId { get; set; }

    public int? UserId { get; set; }

    /// <summary>When true, this notification is visible to authenticated guests.</summary>
    public bool IsPublic { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty;
    [Required]
    public bool IsRead { get; set; } = false;
    #endregion

    #region Relations
    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }
    #endregion
}
