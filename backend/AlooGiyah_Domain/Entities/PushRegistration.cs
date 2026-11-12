using System.ComponentModel.DataAnnotations;
using AlooGiyah_Domain.Entities.UserFolder;
namespace AlooGiyah_Domain.Entities;

public sealed class PushRegistration
{
    [Key, MaxLength(256)] public string Token { get; set; } = "";
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
}
