using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace AlooGiyah_Api.Controllers;
[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = "NotGuest")]
public class AgriculturalOrderController : ControllerBase
{
    #region Constructor
    private readonly IAgriculturalOrderService _service;
    public AgriculturalOrderController(IAgriculturalOrderService service) { _service = service; }
    #endregion
    #region Read
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCode([FromQuery] string code)
    {
        var result = await _service.GetByCodeAsync(code) ?? throw new NotFoundException("سفارش یافت نشد.");
        return Ok(new ApiResponse<AgriculturalOrderDto> { IsSuccess = true, Message = "اطلاعات سفارش", Data = result });
    }
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilter([FromQuery] AgriculturalOrderFilterDto dto)
    {
        var result = await _service.GetByFilterAsync(dto);
        return Ok(new ApiResponse<object> { IsSuccess = true, Message = "فهرست سفارش‌ها", Data = result });
    }
    #endregion
    #region Create From Cart
    // Compatibility route; now returns a Checkout containing several farm orders.
    [HttpPost("CreateFromCart")]
    public async Task<IActionResult> CreateFromCart([FromBody] CheckoutFromCartDto dto)
    {
        var result = await _service.CreateFromCartAsync(dto);
        return Ok(new ApiResponse<CheckoutDto> { IsSuccess = true, Message = "خرید در انتظار پرداخت ثبت شد", Data = result });
    }
    #endregion
    #region Order Operations
    [HttpPost("{code}/Action")]
    public async Task<IActionResult> Action(string code, [FromBody] OrderActionDto dto)
    {
        var result = await _service.ExecuteActionAsync(code, dto);
        return Ok(new ApiResponse<AgriculturalOrderDto> { IsSuccess = true, Message = "عملیات سفارش ثبت شد", Data = result });
    }
    [HttpPost("{code}/Refund/Complete")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> CompleteRefund(string code, [FromBody] CompleteRefundDto dto)
    {
        var result = await _service.CompleteRefundAsync(code, dto);
        return Ok(new ApiResponse<AgriculturalOrderDto> { IsSuccess = true, Message = "تأیید بازپرداخت ثبت شد", Data = result });
    }
    #endregion
}
