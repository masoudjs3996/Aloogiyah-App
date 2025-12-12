
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.UserFolder.AddressFolder;

public class City : BaseEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int CityId { get; set; }

    [Required, MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    public int CountyId { get; set; }

    [ForeignKey(nameof(CountyId))]
    public County County { get; set; } = null!;

    public int StatusId { get; set; }
    [ForeignKey(nameof(StatusId))]
    public Status Status { get; set; } = null!;
}
