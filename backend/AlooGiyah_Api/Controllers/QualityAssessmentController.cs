using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.QualityAssessment;
using AlooGiyah_Application.Interfaces;
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


    #region Create
    [Authorize]
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

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullQualityAssessment);

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
    [Authorize]
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
    [Authorize]
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
    [Authorize]
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