using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.AgriculturalOrderItem;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AgriculturalOrderItemController : ControllerBase
{
    #region Constructor
    private readonly IAgriculturalOrderItemService _agriculturalOrderItemService;

    public AgriculturalOrderItemController(IAgriculturalOrderItemService agriculturalOrderItemService)
    {
        _agriculturalOrderItemService = agriculturalOrderItemService;
    }
    #endregion


    #region CreateAgriculturalOrderItem
    [Authorize]
    [HttpPost("Create")]
    public async Task<IActionResult> CreateAgriculturalOrderItem([FromBody] AgriculturalOrderItemCreateDto createDto, [FromQuery] string orderCode)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _agriculturalOrderItemService.CreateAsync(createDto, orderCode);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "آیتم سفارش کشاورزی با موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    #region GetByFilter
    [Authorize]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilterAsync([FromQuery] AgriculturalOrderItemFilterDto filterDto)
    {
        var result = await _agriculturalOrderItemService.GetByFilterAsync(filterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullAgriculturalOrderItem);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست آیتم‌های سفارش کشاورزی با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetByCode
    [Authorize]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
    {
        var result = await _agriculturalOrderItemService.GetByCodeAsync(code);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullAgriculturalOrderItem);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "آیتم سفارش کشاورزی با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region UpdateAgriculturalOrderItem
    [Authorize]
    [HttpPut("Update")]
    public async Task<IActionResult> UpdateAgriculturalOrderItem(AgriculturalOrderItemUpdateDto updateDto)
    {
        var result = await _agriculturalOrderItemService.UpdateAsync(updateDto);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorAgriculturalOrderItemUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "آیتم سفارش کشاورزی با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region DeleteAgriculturalOrderItem
    [Authorize]
    [HttpDelete("Delete")]
    public async Task<IActionResult> DeleteAgriculturalOrderItem([FromQuery] string code)
    {
        var result = await _agriculturalOrderItemService.DeleteAsync(code);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorAgriculturalOrderItemDelete);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "آیتم سفارش کشاورزی با موفقیت حذف شد",
            Data = code
        });
    }
    #endregion
}