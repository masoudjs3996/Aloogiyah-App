using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AgriculturalOrderController : ControllerBase
{
    #region Constructor
    private readonly IAgriculturalOrderService _agriculturalOrderService;

    public AgriculturalOrderController(IAgriculturalOrderService agriculturalOrderService)
    {
        _agriculturalOrderService = agriculturalOrderService;
    }
    #endregion


    #region Create
    [Authorize(Policy = "NotGuest")]
    [HttpPost("Create")]
    public async Task<IActionResult> CreateAgriculturalOrder(AgriculturalOrderCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _agriculturalOrderService.CreateAsync(createDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "سفارش کشاورزی با موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    [HttpPost("CreateFromCart")]
    [Authorize(Policy = "NotGuest")]
    public async Task<IActionResult> CreateFromCart([FromBody] CheckoutFromCartDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var result = await _agriculturalOrderService.CreateFromCartAsync(dto);

        return Ok(new ApiResponse<AgriculturalOrderDto>
        {
            IsSuccess = true,
            Message = "سفارش با موفقیت از سبد خرید ثبت شد",
            Data = result
        });
    }

    #region GetByFilter
    [Authorize(Policy = "NotGuest")]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilterAsync([FromQuery] AgriculturalOrderFilterDto filterDto)
    {
        var result = await _agriculturalOrderService.GetByFilterAsync(filterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullAgriculturalOrder);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست سفارش‌های کشاورزی با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetByCode
    [HttpGet("GetByCode")]
    [Authorize(Policy = "NotGuest")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
    {
        var result = await _agriculturalOrderService.GetByCodeAsync(code);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullAgriculturalOrder);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "سفارش کشاورزی با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region Update
    [Authorize(Policy = "NotGuest")]
    [HttpPut("Update")]
    public async Task<IActionResult> UpdateAgriculturalOrder(AgriculturalOrderUpdateDto updateDto)
    {
        var result = await _agriculturalOrderService.UpdateAsync(updateDto);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorAgriculturalOrderUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "سفارش کشاورزی با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region Approve Order
    [Authorize(Policy = "NotGuest")]
    [HttpPatch("ChangeOrderStatus")]
    public async Task<IActionResult> ChangeOrderStatus(string OrderCode, OrderAction action)
    {
        var result = await _agriculturalOrderService.ChangeOrderStatus(OrderCode, action);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorStatusUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "وضعیت سفارش کشاورزی با موفقیت ویرایش شد ",
            Data = result
        });
    }
    #endregion

    [HttpPost("pay")]
    [Authorize(Policy = "NotGuest")]
    public async Task<IActionResult> ProceedToPayment(string orderCode)
    {
        var result = await _agriculturalOrderService.ProceedToPaymentAsync(orderCode);

        return Ok(new ApiResponse<PaymentResultDto>
        {
            IsSuccess = true,
            Message = result.Message,
            Data = result
        });
    }

}