using AlooGiyah_Domain.Entities.UserFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.Store;

public class Auction : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AuctionId { get; set; }

    [Required]
    public int AgriculturalProductId { get; set; }

    [Required]
    public DateTimeOffset StartDate { get; set; }

    [Required]
    public DateTimeOffset EndDate { get; set; }

    [Required]
    public decimal StartingPrice { get; set; }

    public decimal? CurrentPrice { get; set; }

    public int? WinnerId { get; set; }

    [Required]
    public int StatusId { get; set; }



    [MaxLength(255)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(255)]
    public string MetaTitle { get; set; } = string.Empty;

    [MaxLength(500)]
    public string MetaDescription { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? MetaKeywords { get; set; }
    #endregion

    #region Relations
    [ForeignKey(nameof(AgriculturalProductId))]
    public AgriculturalProduct AgriculturalProduct { get; set; } = null!;

    [ForeignKey(nameof(WinnerId))]
    public User Winner { get; set; } = null!;

    [ForeignKey(nameof(StatusId))]
    public Status Status { get; set; } = null!;

    public List<AuctionBid> Bids { get; set; } = null!;
    #endregion
}