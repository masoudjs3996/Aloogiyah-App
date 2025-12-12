using AlooGiyah_Domain.Entities.UserFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class RefreshToken : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int RefreshTokenId { get; set; }

    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    public DateTimeOffset Expires { get; set; }

    [Required]
    public bool IsRevoked { get; set; }

    [Required]
    public bool IsUsed { get; set; }

    [Required]
    public int UserId { get; set; }
    #endregion

    #region Relations
    [ForeignKey(nameof(UserId))]
    public User? User { get; set; } 
    #endregion
}