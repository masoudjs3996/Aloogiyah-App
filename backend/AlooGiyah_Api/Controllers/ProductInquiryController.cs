using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.ProductInquiry;
using AlooGiyah_Application.Interfaces.Service.Store;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AlooGiyah_Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "NotGuest")]
public sealed class ProductInquiryController(IProductInquiryService service) : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting("product-inquiry")]
    public async Task<IActionResult> Create(ProductInquiryCreateDto input) =>
        Ok(new ApiResponse<ProductInquiryDto>
        {
            IsSuccess = true,
            Message = "درخواست خرید ثبت شد. پیش‌فاکتور برای شما و فروشنده قابل مشاهده است.",
            Data = await service.CreateAsync(input)
        });

    [HttpGet("Mine")]
    public async Task<IActionResult> Mine([FromQuery] string role = "Buyer", [FromQuery] string filter = "All", [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Data = await service.GetMineAsync(role, filter, page, pageSize)
        });

    [HttpPost("{code}/Action")]
    public async Task<IActionResult> Action(string code, ProductInquiryActionDto input) =>
        Ok(new ApiResponse<ProductInquiryDto>
        {
            IsSuccess = true,
            Data = await service.ActAsync(code, input)
        });
}
