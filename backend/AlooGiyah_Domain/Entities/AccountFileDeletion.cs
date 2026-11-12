using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Domain.Entities;

public sealed class AccountFileDeletion
{
    public int Id { get; set; }
    [MaxLength(16)] public string Storage { get; set; } = "";
    [MaxLength(1000)] public string Key { get; set; } = "";
    public DateTimeOffset RetryAt { get; set; }
}
