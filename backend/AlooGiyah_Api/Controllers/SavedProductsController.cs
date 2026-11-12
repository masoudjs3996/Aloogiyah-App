using AlooGiyah_Application.Commons;
using AlooGiyah_Application.Interfaces.Service.Store;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace AlooGiyah_Api.Controllers;
[ApiController, Route("api/[controller]"), Authorize(Policy = "NotGuest")]
public class SavedProductsController(ISavedProductService service) : ControllerBase
{
    [HttpGet] public async Task<IActionResult> Get() => Ok(new ApiResponse<object> { IsSuccess = true, Data = await service.GetAsync() });
    [HttpPut("{productCode}")] public async Task<IActionResult> Save(string productCode) { await service.SetAsync(productCode, true); return Ok(new ApiResponse<bool> { IsSuccess = true, Data = true }); }
    [HttpDelete("{productCode}")] public async Task<IActionResult> Remove(string productCode) { await service.SetAsync(productCode, false); return Ok(new ApiResponse<bool> { IsSuccess = true, Data = false }); }
}
