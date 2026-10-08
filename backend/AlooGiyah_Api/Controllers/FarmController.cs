using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Farm;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class FarmController : ControllerBase
{
    #region Constructor
    private readonly IFarmService _farmService;

    public FarmController(IFarmService farmService)
    {
        _farmService = farmService;
    }
    #endregion


    #region CreateFarm
    [Authorize(Roles = "Admin,Manager,Farmer")]
    [HttpPost("Create")]    
    public async Task<IActionResult> CreateGreenhouse([FromForm] FarmCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _farmService.CreateWithImageAsync(createDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "گلخانه با موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    #region GetMyFarm
    [Authorize(Roles = "Admin,Manager,Farmer")]
    [HttpGet("GetMyFarm")]
    public async Task<IActionResult> GetMyGreenhouse([FromQuery] GetMyFarmDto greenhouseFilterDto)
    {
        var result = await _farmService.GetMyFarmsAsync(greenhouseFilterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullFarm);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست گلخانه‌های شما با موفقیت دریافت شد",
            Data = result.Items
        });
    }
    #endregion

    #region Get By Filter
    [AllowAnonymous]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilter([FromQuery] FarmFilterDto greenhouseFilterDto)
    {
        var result = await _farmService.GetByFilterAsync(greenhouseFilterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullFarm);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست گلخانه‌ها با موفقیت دریافت شد",
            Data = result.Items
        });
    }
    #endregion

    #region GetByCode
    [AllowAnonymous]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
    {
        var result = await _farmService.GetByCodeAsync(code);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullFarm);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "گلخانه با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region UpdateFarm
    [Authorize(Roles = "Admin,Manager,Farmer")]
    [HttpPut("Update")]
    public async Task<IActionResult> UpdateGreenhouse(FarmUpdateDto updateDto)
    {
        var result = await _farmService.UpdateAsync(updateDto);

        if (result == null )
            throw new NotFoundException(ErrorMessages.ErrorFarmUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "مزرعه با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region UploadImage
    [Authorize(Roles = "Admin,Manager,Farmer")]
    [HttpPatch("UploadImage")]
    public async Task<IActionResult> ChangeFarmImagAsinc([FromForm] UploadFarmImageDto upload)
    {
        var result = await _farmService.ChangeFarmImageAsync(upload);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "عکس مزرعه با موفقیت آپلود شد",
            Data = result
        });
    }
    #endregion

    #region DeleteFarm
    [Authorize(Roles = "Admin,Manager,Farmer")]
    [HttpDelete("Delete")]
    public async Task<IActionResult> DeleteGreenhouse(string code)
    {
        var result = await _farmService.DeleteAsync(code);

        return Ok(new ApiResponse<string>
        {
            IsSuccess = true,
            Message = "مزرعه با موفقیت حذف شد",
            Data = code
        });
    }
    #endregion
}