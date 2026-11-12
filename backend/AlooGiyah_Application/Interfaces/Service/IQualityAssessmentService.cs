using AlooGiyah_Application.DTOs.QualityAssessment;
using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service;

public interface IQualityAssessmentService
{
    Task<string> GetExpertForApplicantAsync(string code);
    Task<QualityAssessmentQuoteDto> QuoteAsync(QualityAssessmentQuoteInput dto);
    Task<decimal> GetFeeAsync();
    Task SetFeeAsync(decimal fee);
    Task<string> UploadReportAsync(string code, Microsoft.AspNetCore.Http.IFormFile file);
    Task<QualityAssessmentDto> RequestAsync(QualityAssessmentRequestDto dto);
    Task<QualityAssessmentDto> CreateAsync(QualityAssessmentCreateDto dto);
    Task<bool> UpdateAsync(QualityAssessmentUpdateDto dto);
    Task<UserDto> AddExpert(AddExpertDto dto);
    Task<bool> DeleteAsync(string code);
    Task<QualityAssessmentDto?> GetByCodeAsync(string code);
    Task<PagedResult<QualityAssessmentDto>> GetByFilterAsync(QualityAssessmentFilterDto filter);
}
