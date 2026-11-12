using AlooGiyah_Api.Realtime;
using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.QualityAssessment;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class QualityAssessmentController : ControllerBase
{
    #region Constractor
    private readonly IQualityAssessmentService _qualityAssessmentService;

    public QualityAssessmentController(IQualityAssessmentService qualityAssessmentService)
    {
        _qualityAssessmentService = qualityAssessmentService;
    }
    #endregion


    [Authorize(Policy = "NotGuest"), HttpPost("{code}/Conversation")]
    public async Task<IActionResult> OpenExpertConversation(string code, [FromServices] IChatMessageService chat, [FromServices] ChatConnectionManager connections)
    {
        var expertCode = await _qualityAssessmentService.GetExpertForApplicantAsync(code);
        var room = await chat.PrepareConversationAsync(expertCode);
        room.PeerOnline = connections.IsUserOnline(room.PeerCode);
        return Ok(new ApiResponse<object> { IsSuccess = true, Data = room });
    }

    [Authorize(Policy = "NotGuest")]
    [HttpPost("Request")]
    public async Task<IActionResult> RequestAssessment([FromBody] QualityAssessmentRequestDto dto)
    {
        var result = await _qualityAssessmentService.RequestAsync(dto);
        return Ok(new ApiResponse<object> { IsSuccess = true, Message = "درخواست تعیین کیفیت ثبت شد", Data = result });
    }

    [Authorize(Policy = "NotGuest"), HttpPost("Quote")]
    public async Task<IActionResult> Quote(QualityAssessmentQuoteInput dto) => Ok(new ApiResponse<object> { IsSuccess = true, Data = await _qualityAssessmentService.QuoteAsync(dto) });
    [Authorize(Policy = "NotGuest"), HttpGet("Tariff")]
    public async Task<IActionResult> Tariff() => Ok(new ApiResponse<decimal> { IsSuccess = true, Data = await _qualityAssessmentService.GetFeeAsync() });
    [Authorize(Roles = "Manager,Admin"), HttpPut("Tariff")]
    public async Task<IActionResult> Tariff(QualityAssessmentTariffInput dto) { await _qualityAssessmentService.SetFeeAsync(dto.Fee); return Ok(new ApiResponse<bool> { IsSuccess = true, Data = true }); }
    [Authorize(Roles = "Expert,Manager,Admin"), HttpPost("{code}/ReportFile"), RequestSizeLimit(16 * 1024 * 1024)]
    public async Task<IActionResult> UploadReport(string code, IFormFile file) => Ok(new ApiResponse<string> { IsSuccess = true, Data = await _qualityAssessmentService.UploadReportAsync(code, file) });
    #region Create
    [Authorize(Roles = "Expert,Manager,Admin")]
    [HttpPost("Create")]
    public async Task<IActionResult> CreateQualityAssessment(QualityAssessmentCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _qualityAssessmentService.CreateAsync(createDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "ارزیابی کیفیت با موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    #region GetByFilter
    [Authorize]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilterAsync([FromQuery] QualityAssessmentFilterDto filterDto)
    {
        var result = await _qualityAssessmentService.GetByFilterAsync(filterDto);


        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست ارزیابی‌های کیفیت با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetByCode
    [Authorize]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
    {
        var result = await _qualityAssessmentService.GetByCodeAsync(code);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullQualityAssessment);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "ارزیابی کیفیت با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region Update
    [Authorize(Roles = "Expert,Manager,Admin")]
    [HttpPut("Update")]
    public async Task<IActionResult> UpdateQualityAssessment(QualityAssessmentUpdateDto updateDto)
    {
        var result = await _qualityAssessmentService.UpdateAsync(updateDto);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorQualityAssessmentUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "ارزیابی کیفیت با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region Update
    [Authorize(Roles = "Manager,Admin")]
    [HttpPatch("AddExpert")]
    public async Task<IActionResult> AddExpert(AddExpertDto updateDto)
    {
        var result = await _qualityAssessmentService.AddExpert(updateDto);

        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorQualityAssessmentUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "کارشناس با موفقیت انتخاب شد",
            Data = result
        });
    }
    #endregion

    #region Delete
    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("Delete")]
    public async Task<IActionResult> DeleteQualityAssessment([FromQuery] string code)
    {
        var result = await _qualityAssessmentService.DeleteAsync(code);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorQualityAssessmentDelete);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "ارزیابی کیفیت با موفقیت حذف شد",
            Data = code
        });
    }
    #endregion
}
