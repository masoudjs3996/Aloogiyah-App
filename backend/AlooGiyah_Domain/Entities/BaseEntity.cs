using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;
[NotMapped]
public abstract class BaseEntity
{
    public BaseEntity()
    {
        Code = GenerateUniqueCode();
        CreatedAt = DateTimeOffset.UtcNow;
    }
   [Required, MaxLength(10)]
    public string Code { get; private set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; } 

    public bool IsDeleted { get; set; } = false;

    private static string GenerateUniqueCode()
    {
        return Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper();
    }
}
