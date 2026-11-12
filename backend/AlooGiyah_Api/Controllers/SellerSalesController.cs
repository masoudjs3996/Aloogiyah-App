using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Discount;
using AlooGiyah_Application.Services.Store;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[ApiController, Route("api/SellerSales"), Authorize(Policy = "NotGuest", Roles = "Farmer")]
public class SellerSalesController(SellerSalesService service) : ControllerBase
{
    private IActionResult Result(object data) => Ok(new ApiResponse<object> { IsSuccess = true, Data = data, Message = "عملیات موفق بود." });
    [HttpGet("Summary")] public async Task<IActionResult> Summary() => Result(await service.Summary());
    [HttpGet("Customers")] public async Task<IActionResult> Customers([FromQuery] string? search, [FromQuery] int page = 1) => Result(await service.Customers(search, page));
    [HttpGet("Customers/{code}")] public async Task<IActionResult> Customer(string code) => Result(await service.Customer(code));
    [HttpGet("Customers/{code}/Orders")] public async Task<IActionResult> History(string code, [FromQuery] int page = 1) => Result(await service.CustomerHistory(code, page));
    [HttpGet("Products")] public async Task<IActionResult> Products() => Result(await service.Products());
    [HttpGet("Discounts")] public async Task<IActionResult> Discounts([FromQuery] int page = 1) => Result(await service.Discounts(page));
    [HttpPost("Discounts")] public async Task<IActionResult> Create(SellerDiscountCreateDto dto) => Result(await service.Create(dto));
    [HttpPost("Discounts/{code}/Disable")] public async Task<IActionResult> Disable(string code) { await service.Disable(code); return Result(true); }
}
