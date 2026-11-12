using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Wallet;
using AlooGiyah_Application.Services.Store;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[ApiController, Route("api/Settlement"), Authorize(Policy = "NotGuest")]
public class SettlementController(SettlementService service) : ControllerBase
{
    private IActionResult Result(object data) => Ok(new ApiResponse<object> { IsSuccess = true, Data = data, Message = "عملیات موفق بود." });
    [HttpGet("Summary")] public async Task<IActionResult> Summary() => Result(await service.Summary());
    [HttpGet("Rates")] public async Task<IActionResult> Rates() => Result(await service.Rates());
    [HttpPut("Rates"), Authorize(Roles = "Manager")]
    public async Task<IActionResult> Rates(SettlementRatesDto dto) { await service.SetRates(dto); return Result(true); }
    [HttpGet("Income")] public async Task<IActionResult> Income([FromQuery] int page = 1) => Result(await service.Income(page));
    [HttpGet("Requests")] public async Task<IActionResult> Requests([FromQuery] string? status, [FromQuery] int page = 1) => Result(await service.List(false, status, page));
    [HttpGet("Manage"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Manage([FromQuery] string? status, [FromQuery] int page = 1) => Result(await service.List(true, status, page));
    [HttpPost("Requests")] public async Task<IActionResult> Create(SettlementCreateDto dto) => Result(await service.Create(dto));
    [HttpGet("Export"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Export([FromQuery] DateOnly? dueOn)
    {
        var date = dueOn ?? DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, SettlementPolicy.Tehran).DateTime);
        var csv = await service.Export(date);
        return File(System.Text.Encoding.UTF8.GetPreamble().Concat(System.Text.Encoding.UTF8.GetBytes(csv)).ToArray(),
            "text/csv; charset=utf-8", $"settlements-{date:yyyy-MM-dd}.csv");
    }
    [HttpPost("Requests/{code}/Actions")] public async Task<IActionResult> Act(string code, SettlementActionDto dto) => Result(await service.Act(code, dto));
    [HttpGet("Calendar"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Calendar([FromQuery] DateOnly from, [FromQuery] DateOnly to) => Result(await service.Calendar(from, to));
    [HttpPut("Calendar"), Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> SaveCalendar(SettlementCalendarDto dto) { await service.SaveCalendar(dto); return Result(true); }
}
