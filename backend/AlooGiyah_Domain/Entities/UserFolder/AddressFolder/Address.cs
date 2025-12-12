using AlooGiyah_Domain.Entities.Store;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.UserFolder.AddressFolder;

public class Address : BaseEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AddressId { get; set; }

    [Required]
    public int UserId { get; set; }

    // ---- New fields ----

    [Required]
    public int ProvinceId { get; set; }

    [Required]
    public int CountyId { get; set; }

    public int? CityId { get; set; }     // nullable
    public int? VillageId { get; set; }  // nullable

    // Other fields
    public string Street { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool IsDefault { get; set; }

    // ----------------- Relations -----------------

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    [ForeignKey(nameof(ProvinceId))]
    public Province Province { get; set; } = null!;

    [ForeignKey(nameof(CountyId))]
    public County County { get; set; } = null!;

    [ForeignKey(nameof(CityId))]
    public City? City { get; set; }

    [ForeignKey(nameof(VillageId))]
    public Village? Village { get; set; }

    public List<AgriculturalOrder> AgriculturalOrders { get; set; } = null!;
    public List<Order> Orders { get; set; } = null!;

}