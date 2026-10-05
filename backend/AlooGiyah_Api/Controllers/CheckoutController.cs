using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Application.Interfaces.Service.Store;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace AlooGiyah_Api.Controllers;
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "NotGuest")]
public class CheckoutController : ControllerBase
{
    private readonly ICheckoutService _service;
    public CheckoutController(ICheckoutService service) { _service = service; }
    [HttpPost("CreateFromCart")]
    public async Task<IActionResult> Create([FromBody] CheckoutFromCartDto dto) => Result(await _service.CreateFromCartAsync(dto));
    [HttpGet("{code}")]
    public async Task<IActionResult> Get(string code) => Result(await _service.GetByCodeAsync(code));
    [HttpPost("{code}/Pay/Wallet")]
    public async Task<IActionResult> Pay(string code) => Result(await _service.PayWithWalletAsync(code));
    [HttpPost("{code}/Cancel")]
    public async Task<IActionResult> Cancel(string code)
    {
        await _service.ExpireAsync(code);
        return Ok(new ApiResponse<object> { IsSuccess = true, Message = "خرید در انتظار پرداخت لغو شد", Data = code });
    }
    private IActionResult Result(CheckoutDto dto) => Ok(new ApiResponse<CheckoutDto>
        { IsSuccess = true, Message = "اطلاعات خرید", Data = dto });
}
