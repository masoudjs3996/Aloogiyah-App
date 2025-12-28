using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.UserFolder;

public class User : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int UserId { get; set; }


    [MaxLength(80)]
    public string FName { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? LName { get; set; }



    [MaxLength(255)]
    public string? Email { get; set; } 

    [Required]
    [MaxLength(50)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    [MaxLength(256)]
    public string Password { get; set; } = string.Empty;

    public int Age { get; set; }

    [MaxLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    public int RoleId { get; set; }

    [MaxLength(50)]
    public string? EmailVerificationCode { get; set; }

    public bool IsEmailConfirmed { get; set; }

    public DateTimeOffset? VerificationCodeExpiration { get; set; }

    [MaxLength(50)]
    public string? PasswordResetCode { get; set; }

    public DateTimeOffset? PasswordResetExpiration { get; set; }
    #endregion

    #region Relations
    [ForeignKey(nameof(RoleId))]
    public Role Role { get; set; } = null!;
    public Wallet Wallet { get; set; } = null!;
    public List<Article> Articles { get; set; } = null!;
    public List<ChatMessage> SentMessages { get; set; } = null! ;
    public List<ChatMessage> ReceivedMessages { get; set; } = null!;
    public List<Order> Orders { get; set; } = null!;
    public List<AgriculturalOrder> AgriculturalOrders { get; set; } = null!;
    public List<ServiceRequest> ServiceRequests { get; set; } = null!;
    public List<ServiceRequest> ProvidedServiceRequests { get; set; } = null!;
    public List<RefreshToken> RefreshTokens { get; set; } = null!;
    public List<AgriculturalProduct> AgriculturalProducts { get; set; } = null!;
    public List<Warehouse> Warehouses { get; set; } = null!;
    public List<QualityAssessment> ExpertQualityAssessments { get; set; } = null!;
    public List<QualityAssessment> ApplicantQualityAssessments { get; set; } = null!;
    public List<AuctionBid> AuctionBids { get; set; } = null!;
    public List<Auction> WonAuctions { get; set; } = null!;
    public List<Notification> Notifications { get; set; } = null!;
    public List<StatusChangeLog> StatusChangeLogs { get; set; } = null!;
    public List<Comment> Comments { get; set; } = null!;
    public List<Files> Files{ get; set; } = null!;
    public List<Farm> Farms { get; set; } = null!;
    public List<Discount> Discounts { get; set; } = null!;
    public List<Address> Addresses { get; set; } = null!;
    public List<Cart> Carts { get; set; } = null!;

    #endregion
}