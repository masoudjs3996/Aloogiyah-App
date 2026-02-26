using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Warehouse;
using AlooGiyah_Application.DTOs.WarehouseInventory;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class WarehouseInventoryController : ControllerBase
{
    #region Constractor
    private readonly IWarehouseInventoryService _warehouseInventoryService;

    public WarehouseInventoryController(IWarehouseInventoryService warehouseInventoryService)
    {
        _warehouseInventoryService = warehouseInventoryService;
    }
    #endregion

    #region Create
    [Authorize(Roles = "Farmer,Manager")]
    [HttpPost("Create")]
    public async Task<IActionResult> CreateWarehouseInventory(WarehouseInventoryCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _warehouseInventoryService.CreateAsync(createDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "موجودی انبار با موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    #region GetByFilter
    [Authorize(Roles = "Farmer,Manager")]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilterAsync([FromQuery] WarehouseInventoryFilterDto filterDto)
    {
        var result = await _warehouseInventoryService.GetByFilterAsync(filterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullWarehouseInventory);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست موجودی‌های انبار با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetByCode
    [Authorize(Roles = "Farmer,Manager")]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
    {
        var result = await _warehouseInventoryService.GetByCodeAsync(code);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullWarehouseInventory);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "موجودی انبار با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region Update
    [Authorize(Roles = "Farmer,Manager")]
    [HttpPut("Update")]
    public async Task<IActionResult> UpdateWarehouseInventory(WarehouseInventoryUpdateDto updateDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _warehouseInventoryService.UpdateAsync(updateDto);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorWarehouseInventoryUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "موجودی انبار با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region Delete
    [Authorize(Roles = "Farmer,Manager")]
    [HttpDelete("Delete")]
    public async Task<IActionResult> DeleteWarehouseInventory([FromQuery] string code)
    {
        var result = await _warehouseInventoryService.DeleteAsync(code);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorWarehouseInventoryDelete);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "موجودی انبار با موفقیت حذف شد",
            Data = code
        });
    }
    #endregion
}