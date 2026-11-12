namespace AlooGiyah_Domain.Entities;
public class QualityAssessmentTariff : BaseEntity
{
    public int QualityAssessmentTariffId { get; set; }
    public decimal Fee { get; set; } = 1500000m;
}
