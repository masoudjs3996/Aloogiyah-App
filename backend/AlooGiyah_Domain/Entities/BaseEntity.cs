using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Security.Cryptography;

namespace AlooGiyah_Domain.Entities;
[NotMapped]
public abstract class BaseEntity
{
    private const string CodeAlphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

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

    public void RegenerateCode() => Code = GenerateUniqueCode();

    private static string GenerateUniqueCode()
    {
        return string.Create(10, CodeAlphabet, (code, alphabet) =>
        {
            for (var index = 0; index < code.Length; index++)
                code[index] = alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)];
        });
    }
}
