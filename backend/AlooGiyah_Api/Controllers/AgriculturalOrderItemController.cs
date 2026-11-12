using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.AgriculturalOrderItem;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace AlooGiyah_Api.Controllers;
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "NotGuest")]
public class AgriculturalOrderItemController : ControllerBase
{
    private readonly IAgriculturalOrderItemService _service;
    public AgriculturalOrderItemController(IAgriculturalOrderItemService service) { _service = service; }
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCode([FromQuery] string code)
    {
        var result = await _service.GetByCodeAsync(code) ?? throw new NotFoundException("آیتم یافت نشد.");
        return Ok(new ApiResponse<object> { IsSuccess = true, Message = "آیتم سفارش", Data = result });
    }
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilter([FromQuery] AgriculturalOrderItemFilterDto dto) =>
        Ok(new ApiResponse<object> { IsSuccess = true, Message = "آیتم‌های سفارش", Data = await _service.GetByFilterAsync(dto) });
}
