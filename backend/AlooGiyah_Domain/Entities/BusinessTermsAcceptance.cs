namespace AlooGiyah_Domain.Entities;

public class BusinessTermsAcceptance : BaseEntity
{
    public int BusinessTermsAcceptanceId { get; set; }
    public int BusinessApplicationId { get; set; }
    public int UserId { get; set; }
    public string BusinessType { get; set; } = "";
    public string TermsVersion { get; set; } = "";
    public string TermsHash { get; set; } = "";
    public string TermsSnapshot { get; set; } = "";
    public DateTimeOffset AcceptedAt { get; set; }
}
