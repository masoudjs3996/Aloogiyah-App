using AlooGiyah_Domain.Entities;
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Domain.Entities.UserFolder;

public class PhoneOtpChallenge : BaseEntity
{
    [Key]
    public int PhoneOtpChallengeId { get; set; }

    [Required, MaxLength(20)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string CodeHash { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Purpose { get; set; } = string.Empty;

    [MaxLength(80)]
    public string? FName { get; set; }

    [MaxLength(150)]
    public string? LName { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }
    public int FailedAttempts { get; set; }
}
