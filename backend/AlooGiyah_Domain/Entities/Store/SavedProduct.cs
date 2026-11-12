using AlooGiyah_Domain.Entities.UserFolder;
namespace AlooGiyah_Domain.Entities.Store;
public class SavedProduct : BaseEntity
{
    public int SavedProductId { get; set; }
    public int UserId { get; set; }
    public int AgriculturalProductId { get; set; }
    public User User { get; set; } = null!;
    public AgriculturalProduct AgriculturalProduct { get; set; } = null!;
}
