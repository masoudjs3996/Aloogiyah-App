using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class QualityAssessment : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int QualityAssessmentId { get; set; }
    [Required]
    public int AgriculturalProductId { get; set; }

    public int? AgriculturalOrderId { get; set; }
    public AgriculturalOrder? AgriculturalOrder { get; set; }
    [MaxLength(700)] public string RequestDescription { get; set; } = string.Empty;
    public decimal? RequestedQuantity { get; set; }
    public decimal Fee { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public DateTimeOffset? PaidAt { get; set; }
    [MaxLength(100)] public string? IdempotencyKey { get; set; }
    [MaxLength(64)] public string? RequestHash { get; set; }
    [MaxLength(1000)] public string? ReportFileUrl { get; set; }
    [MaxLength(4000)] public string? ReportJson { get; set; }
    public int? ExpertId { get; set; }

    [Required]
    public int ApplicantId { get; set; }

    [Required]
    [MaxLength(1000)]
    public string QualityDescription { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string QualityGrade { get; set; } = string.Empty;

    public decimal? SuggestedPrice { get; set; }

    public DateTimeOffset? AssessmentDate { get; set; }
    #endregion

    #region Relations
    [ForeignKey(nameof(AgriculturalProductId))]
    public AgriculturalProduct AgriculturalProduct { get; set; } = null!;

    [ForeignKey(nameof(ExpertId))]
    public User? Expert { get; set; } = null!;

    [ForeignKey(nameof(ApplicantId))]
    public User Applicant { get; set; } = null!;
    #endregion
}