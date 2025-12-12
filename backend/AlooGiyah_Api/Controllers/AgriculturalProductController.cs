using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AgriculturalProductController : ControllerBase
{
    #region Constructor
    private readonly IAgriculturalProductService _agriculturalProductService;

    public AgriculturalProductController(IAgriculturalProductService agriculturalProductService)
    {
        _agriculturalProductService = agriculturalProductService;
    }
    #endregion


    #region CreateAgriculturalProduct
    [Authorize(Roles = "Admin,Manager,Farmer")]
    [HttpPost("Create")]
    public async Task<IActionResult> CreateAgriculturalProduct(AgriculturalProductCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _agriculturalProductService.CreateAsync(createDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "محصول کشاورزی با موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    #region GetByFilter
    [AllowAnonymous]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilterAsync([FromQuery] AgriculturalProductFilterDto filterDto)
    {
        var result = await _agriculturalProductService.GetByFilterAsync(filterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullAgriculturalProduct);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست محصولات کشاورزی با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetByCode
    [AllowAnonymous]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
    {
        var result = await _agriculturalProductService.GetByCodeAsync(code);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullAgriculturalProduct);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "محصول کشاورزی با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region UpdateAgriculturalProduct
    [Authorize(Roles = "Admin,Manager,Farmer")]
    [HttpPut("Update")]
    public async Task<IActionResult> UpdateAgriculturalProduct(AgriculturalProductUpdateDto updateDto)
    {
        var result = await _agriculturalProductService.UpdateAsync(updateDto);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorAgriculturalProductUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "محصول کشاورزی با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region DeleteAgriculturalProduct
    [Authorize(Roles = "Admin,Manager,Farmer")]
    [HttpDelete("Delete")]
    public async Task<IActionResult> DeleteAgriculturalProduct([FromQuery] string code)
    {
        var result = await _agriculturalProductService.DeleteAsync(code);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorAgriculturalProductDelete);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "محصول کشاورزی با موفقیت حذف شد",
            Data = code
        });
    }
    #endregion
}