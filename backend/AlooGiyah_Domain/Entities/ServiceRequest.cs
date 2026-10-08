using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class ServiceRequest : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ServiceRequestId { get; set; }

    [Required]
    public ServiceRequestType ServiceType { get; set; }

    [Required]
    public int StatusId { get; set; }

    [Required]
    public int UserId { get; set; }

    public int? AddressId { get; set; }

    public int? ProviderId { get; set; }

    public decimal Price { get; set; } 

    public int? DiscountId { get; set; } // کد تخفیف استفاده‌شده (اختیاری)

    public decimal DiscountAmount { get; set; } // مقدار تخفیف اعمال‌شده

    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;


    public DateTimeOffset? servicedate { get; set; }

    public int? NumberOfVases { get; set; }      // تعداد گلدان
    public double? GardenArea { get; set; }      // مساحت باغچه متر مربع
    public double? GreenhouseArea { get; set; }  // متراژ گلخانه 

    #endregion

    #region Relations
    [ForeignKey(nameof(StatusId))]
    public Status Status { get; set; } = null!;


    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;


    [ForeignKey(nameof(ProviderId))]
    public User? Provider { get; set; } 

    [ForeignKey(nameof(AddressId))]
    public AlooGiyah_Domain.Entities.UserFolder.AddressFolder.Address? Address { get; set; }

    [ForeignKey(nameof(DiscountId))]
    public Discount? Discount { get; set; } 

    #endregion
}
