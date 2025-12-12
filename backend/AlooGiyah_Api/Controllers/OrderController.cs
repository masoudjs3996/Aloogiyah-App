using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Order;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OrderController : ControllerBase
{
    #region Constructor
    private readonly IOrderService _orderService;

    public OrderController(IOrderService orderService)
    {
        _orderService = orderService;
    }
    #endregion


    #region CreateOrder
    [Authorize]
    [HttpPost("CreateOrder")]
    public async Task<IActionResult> CreateOrder(OrderCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _orderService.CreateAsync(createDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "سفارش با موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    #region GetByFilter
    [Authorize]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilterAsync([FromQuery] OrderFilterDto orderFilterDto)
    {
        var result = await _orderService.GetByFilterAsync(orderFilterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullOrder);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست سفارش‌ها با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetByCode
    [Authorize]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
    {
        var result = await _orderService.GetByCodeAsync(code);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullOrder);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "سفارش با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region UpdateOrder
    [Authorize]
    [HttpPut("UpdateOrder")]
    public async Task<IActionResult> UpdateOrder(OrderUpdateDto updateDto)
    {
        var result = await _orderService.UpdateAsync(updateDto);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorOrderUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "سفارش با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion
}