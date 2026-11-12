using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Application.Services.Store;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace AlooGiyah_Api.Controllers;

[ApiController, Route("api/Delivery"), Authorize(Policy = "NotGuest")]
public class DeliveryController(DeliveryService service) : ControllerBase
{
    private IActionResult Result(object data) => Ok(new ApiResponse<object> { IsSuccess = true, Data = data, Message = "عملیات موفق بود." });
    [AllowAnonymous, HttpGet("Points")] public async Task<IActionResult> Points([FromQuery] bool manage = false) => Result(await service.Points(manage));
    [HttpGet("Destinations")] public async Task<IActionResult> Destinations([FromQuery] Guid cartId) => Result(await service.Destinations(cartId));
    [HttpGet("Counties"), Authorize(Roles = "Admin,Manager")] public async Task<IActionResult> Counties() => Result(await service.Counties());
    [HttpGet("Routes"), Authorize(Roles = "Admin,Manager")] public async Task<IActionResult> Routes() => Result(await service.Routes());
    [HttpPost("Routes"), Authorize(Roles = "Admin,Manager")] public async Task<IActionResult> Route(DeliveryRouteInput dto) { await service.SaveRoute(null, dto); return Result(true); }
    [HttpPut("Routes/{code}"), Authorize(Roles = "Admin,Manager")] public async Task<IActionResult> Route(string code, DeliveryRouteInput dto) { await service.SaveRoute(code, dto); return Result(true); }
    [HttpGet("Routes/{code}/TariffCategories"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> TariffCategories(string code, [FromQuery] string? search) => Result(await service.TariffCategories(code, search));
    [HttpGet("Routes/{code}/Tariffs"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Tariffs(string code) => Result(await service.CategoryTariffs(code));
    [HttpPut("Routes/{code}/Tariffs"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Tariff(string code, DeliveryCategoryTariffInput dto) { await service.SaveCategoryTariff(code, dto); return Result(true); }
    [HttpDelete("Routes/{code}/Tariffs/{categoryCode}/{saleUnit}"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> RemoveTariff(string code, string categoryCode, string saleUnit) { await service.RemoveCategoryTariff(code, categoryCode, saleUnit); return Result(true); }
    [HttpPost("Tariffs/Increase/Preview"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> PreviewIncrease(DeliveryTariffIncreaseInput dto) => Result(await service.IncreaseTariffs(dto, false));
    [HttpPost("Tariffs/Increase/Apply"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> ApplyIncrease(DeliveryTariffIncreaseInput dto) => Result(await service.IncreaseTariffs(dto, true));
    [HttpPost("Bookings/{code}/Legs/{leg}/Price"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> LegPrice(string code, string leg, DeliveryLegPriceInput dto) { await service.PriceLeg(code, leg, dto.Fee); return Result(true); }
    [HttpPost("Bookings/{code}/Legs/{leg}/Dispatch"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Dispatch(string code, string leg) { await service.Dispatch(code, leg); return Result(true); }
    [HttpGet("Agents"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Agents() => Result(await service.Agents());
    [HttpPost("Points"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Point(DeliveryPointInput dto) { await service.SavePoint(null, dto); return Result(true); }
    [HttpPut("Points/{code}"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Point(string code, DeliveryPointInput dto) { await service.SavePoint(code, dto); return Result(true); }
    [HttpPost("Quotes")] public async Task<IActionResult> Quote(DeliveryQuoteInput dto) => Result(await service.Quote(dto));
    [HttpPost("Bookings/{code}/DeferredFee/Accept")]
    public async Task<IActionResult> AcceptDeferredFee(string code, DeliveryPriceInput dto) { await service.AcceptDeferredFee(code, dto.Fee); return Result(true); }
    [HttpPost("Legacy"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Legacy(LegacyDeliveryInput dto) => Result(await service.AttachLegacy(dto));
    [HttpGet("Preview")]
    public async Task<IActionResult> Preview([FromQuery] Guid cartId, [FromQuery] string method = "Pickup") => Result(await service.Preview(cartId, method));
    [AllowAnonymous, HttpGet("PublicFarmPoint/{farmCode}")]
    public async Task<IActionResult> PublicFarmPoint(string farmCode) => Result((await service.PublicFarmPoint(farmCode))!);

    [HttpGet("FarmPoint/{farmCode}")]
    public async Task<IActionResult> FarmPoint(string farmCode) => Result(await service.FarmPoint(farmCode));
    [HttpPut("FarmPoint/{farmCode}")]
    public async Task<IActionResult> FarmPoint(string farmCode, FarmDeliveryPointInput dto) => Result(await service.FarmPoint(farmCode, dto.PointCode));
    [HttpGet("Bookings")] public async Task<IActionResult> List([FromQuery] bool manage = false, [FromQuery] int page = 1, [FromQuery] string? checkout = null) => Result(await service.List(manage, page, checkout));
    [HttpGet("Bookings/{code}")] public async Task<IActionResult> Get(string code) => Result(await service.Get(code));
    [HttpPost("Bookings/{code}/Price"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Price(string code, DeliveryPriceInput dto) { await service.Price(code, dto.Fee); return Result(true); }
    [HttpPost("Bookings/{code}/Receive"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Receive(string code, HubReceiptInput dto) { await service.Receive(code, dto); return Result(true); }
    [HttpPost("Bookings/{code}/Batches"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Batch(string code, DeliveryBatchInput dto) { await service.CreateBatch(code, dto); return Result(true); }
    [HttpGet("Bookings/{code}/PurchaseCode")]
    public async Task<IActionResult> PurchaseCode(string code) { Response.Headers.CacheControl = "no-store"; return Result(await service.PurchaseDeliveryCode(code)); }
    [HttpPost("Bookings/{code}/Batches/{batch}/Code")]
    public async Task<IActionResult> Code(string code, string batch) { Response.Headers.CacheControl = "no-store"; return Result(await service.IssueCode(code, batch)); }
    [HttpPost("Bookings/{code}/Batches/{batch}/Verify")]
    public async Task<IActionResult> Verify(string code, string batch, DeliveryVerifyInput dto) { await service.Verify(code, batch, dto.Code); return Result(true); }
    [HttpPost("Bookings/{code}/Batches/{batch}/Actions/{action}")]
    public async Task<IActionResult> Act(string code, string batch, string action, DeliveryNoteInput dto) { await service.BatchAction(code, batch, action, dto.Note); return Result(true); }
    [HttpPost("Bookings/{code}/Change")]
    public async Task<IActionResult> Change(string code, DeliveryChangeInput dto) { await service.RequestChange(code, dto); return Result(true); }
    [HttpPost("Bookings/{code}/Change/Price"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> ChangePrice(string code, DeliveryPriceInput dto) { await service.PriceChange(code, dto.Fee); return Result(true); }
    [HttpPost("Bookings/{code}/Change/Accept")]
    public async Task<IActionResult> Accept(string code, DeliveryPriceInput dto) { await service.AcceptChange(code, dto.Fee); return Result(true); }
    [HttpPost("Bookings/{code}/Retry/Price"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> RetryPrice(string code, DeliveryRetryPriceInput dto) { await service.PriceRetry(code, dto); return Result(true); }
    [HttpPost("Bookings/{code}/Change/Cancel")]
    public async Task<IActionResult> Cancel(string code) { await service.CancelChange(code); return Result(true); }
}
