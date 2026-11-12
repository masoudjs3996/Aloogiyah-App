using AlooGiyah_Application.DTOs.QualityAssessment;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface IQualityAssessmentQuery
{
    Task<QualityAssessmentDto?> GetByCodeAsync(string code);
    Task<PagedResult<QualityAssessmentDto>> GetByFilterAsync(QualityAssessmentFilterDto filter);
}
