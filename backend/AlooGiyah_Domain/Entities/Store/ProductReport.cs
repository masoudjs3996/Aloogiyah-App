using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Domain.Entities.Store;

public sealed class ProductReport
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int ReporterId { get; set; }
    [MaxLength(1000)]
    public string Reason { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public int? ReviewedById { get; set; }
}
