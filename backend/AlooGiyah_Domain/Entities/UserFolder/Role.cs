using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.UserFolder;

public class Role : BaseEntity
{
    #region Properties
    [Key]
    public int RoleId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }
    #endregion

    #region Relations
    public List<User> Users { get; set; } = null!;
    #endregion
}