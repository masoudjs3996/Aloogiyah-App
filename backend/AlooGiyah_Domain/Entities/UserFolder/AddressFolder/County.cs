using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.UserFolder.AddressFolder;

public class County : BaseEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int CountyId { get; set; }

    [Required, MaxLength(255)]
    public string Name { get; set; } = string.Empty;


    public int StatusId { get; set; }
    [ForeignKey(nameof(StatusId))]
    public Status Status { get; set; } = null!;

    public int ProvinceId { get; set; }

    [ForeignKey(nameof(ProvinceId))]
    public Province Province { get; set; } = null!;

    public List<City> Cities { get; set; } = new();
    public List<Village> Villages { get; set; } = new();
}
