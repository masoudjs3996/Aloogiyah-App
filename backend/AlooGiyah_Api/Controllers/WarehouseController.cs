using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Warehouse;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class WarehouseController : ControllerBase
{
    #region Constractor
    private readonly IWarehouseService _warehouseService;

    public WarehouseController(IWarehouseService warehouseService)
    {
        _warehouseService = warehouseService;
    }
    #endregion


    #region Create
    [Authorize(Roles = "Admin,Farmer,Manager")]
    [HttpPost("Create")]
    public async Task<IActionResult> CreateWarehouse(WarehouseCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _warehouseService.CreateAsync(createDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "انبار با موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    #region GetByFilter
    [Authorize(Roles = "Admin,Farmer,Manager")]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilterAsync([FromQuery] WarehouseFilterDto filterDto)
    {
        var result = await _warehouseService.GetByFilterAsync(filterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullWarehouse);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست انبارها با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetByCode
    [Authorize(Roles = "Admin,Farmer,Manager")]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
    {
        var result = await _warehouseService.GetByCodeAsync(code);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullWarehouse);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "انبار با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region Update
    [Authorize(Roles = "Admin,Farmer,Manager")]
    [HttpPut("Update")]
    public async Task<IActionResult> UpdateWarehouse(WarehouseUpdateDto updateDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _warehouseService.UpdateAsync(updateDto);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorWarehouseUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "انبار با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region Delete
    [Authorize(Roles = "Admin,Farmer,Manager")]
    [HttpDelete("Delete")]
    public async Task<IActionResult> DeleteWarehouse([FromQuery] string code)
    {
        var result = await _warehouseService.DeleteAsync(code);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorWarehouseDelete);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "انبار با موفقیت حذف شد",
            Data = code
        });
    }
    #endregion
}