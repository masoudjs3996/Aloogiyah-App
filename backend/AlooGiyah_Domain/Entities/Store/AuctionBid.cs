using AlooGiyah_Domain.Entities.UserFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.Store;

public class AuctionBid : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int AuctionBidId { get; set; }

    [Required]
    public int AuctionId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public decimal BidAmount { get; set; }

    #endregion

    #region Relations
    [ForeignKey(nameof(AuctionId))]
    public Auction Auction { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
    #endregion
}