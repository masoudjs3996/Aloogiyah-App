using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class Status : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int StatusId { get; set; }

    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public EntityStatus EntityStatus { get; set; }

    #endregion

    #region Relations
    public List<Order> Orders { get; set; } = null!;
    public List<AgriculturalOrder> AgriculturalOrders { get; set; } = null!;
    public List<AgriculturalProduct> AgriculturalProducts { get; set; } = null!;
    public List<ServiceRequest> ServiceRequests { get; set; } = null!;
    public List<Auction> Auctions { get; set; } = null!;
    public List<StatusChangeLog> OldStatusChangeLogs { get; set; } = null!;
    public List<StatusChangeLog> NewStatusChangeLogs { get; set; } = null!;
    public List<Comment> Comments { get; set; } = null!;
    #endregion
}