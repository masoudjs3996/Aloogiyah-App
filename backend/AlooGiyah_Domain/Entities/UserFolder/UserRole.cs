using AlooGiyah_Domain.Entities;

namespace AlooGiyah_Domain.Entities.UserFolder;

// Additional roles supplement the user's legacy primary RoleId.
public class UserRole : BaseEntity
{
    public int UserId { get; set; }
    public int RoleId { get; set; }
    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;
}
