using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.OrderItem;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OrderItemsController : ControllerBase
{
    #region Constructor
    private readonly IOrderItemService _orderItemService;

    public OrderItemsController(IOrderItemService orderItemService)
    {
        _orderItemService = orderItemService;
    }
    #endregion


    #region CreateOrderItem
    [Authorize]
    [HttpPost("CreateOrderItem")]
    public async Task<IActionResult> CreateOrderItem(string orderCode, [FromBody] OrderItemCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _orderItemService.CreateAsync(createDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "آیتم سفارش با موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    #region GetByFilter
    [Authorize]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilterAsync(string orderCode, [FromQuery] OrderItemFilterDto filterDto)
    {
        filterDto.OrderCode = orderCode;
        var result = await _orderItemService.GetByFilterAsync(filterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullOrderItem);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست آیتم‌های سفارش با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region Get By Code
    [Authorize]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string orderItemCode)
    {
        var result = await _orderItemService.GetByCodeAsync(orderItemCode);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullOrderItem);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "آیتم سفارش با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region UpdateOrderItem
    [Authorize]
    [HttpPut("UpdateOrderItem")]
    public async Task<IActionResult> UpdateOrderItem([FromBody] OrderItemUpdateDto updateDto)
    {
        var result = await _orderItemService.UpdateAsync(updateDto);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorOrderItemUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "آیتم سفارش با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region DeleteOrderItem
    [Authorize]
    [HttpDelete("DeleteOrderItem")]
    public async Task<IActionResult> DeleteOrderItem([FromQuery] int orderItemId)
    {
        var result = await _orderItemService.DeleteAsync(orderItemId);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorOrderItemDelete);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "آیتم سفارش با موفقیت حذف شد",
            Data = orderItemId
        });
    }
    #endregion
}