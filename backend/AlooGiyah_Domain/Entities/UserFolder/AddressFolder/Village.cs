
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.UserFolder.AddressFolder;

public class Village : BaseEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int VillageId { get; set; }

    [Required, MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    public int StatusId { get; set; }
    [ForeignKey(nameof(StatusId))]
    public Status Status { get; set; } = null!;

    public int CountyId { get; set; } // روستا مستقیماً به شهرستان متصل میشه

    [ForeignKey(nameof(CountyId))]
    public County County { get; set; } = null!;

  
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}
