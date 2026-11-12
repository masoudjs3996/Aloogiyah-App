using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Application.DTOs.Farm;
using AlooGiyah_Application.DTOs.Category;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.Store;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

// Existing storefront endpoints keep their array response. Mobile needs totalCount
// to paginate beyond the first page without truncation or speculative requests.
[ApiController]
[Authorize]
[Route("api/MobileCatalog")]
public sealed class MobileCatalogController(
    IAgriculturalProductService products,
    IFarmService farms,
    ICategoryService categories) : ControllerBase
{
    [HttpGet("Products")]
    public async Task<IActionResult> Products([FromQuery] AgriculturalProductFilterDto filter)
    {
        filter.PageNumber = Math.Max(1, filter.PageNumber);
        filter.PageSize = Math.Clamp(filter.PageSize, 1, 100);
        return Ok(new ApiResponse<object> { IsSuccess = true, Data = await products.GetByFilterAsync(filter) });
    }

    [HttpGet("Farms")]
    public async Task<IActionResult> Farms([FromQuery] FarmFilterDto filter)
    {
        filter.PageNumber = Math.Max(1, filter.PageNumber);
        filter.PageSize = Math.Clamp(filter.PageSize, 1, 100);
        return Ok(new ApiResponse<object> { IsSuccess = true, Data = await farms.GetByFilterAsync(filter) });
    }

    [AllowAnonymous]
    [HttpGet("Categories")]
    public async Task<IActionResult> Categories([FromQuery] CategoryFilterDto filter)
    {
        filter.PageNumber = Math.Max(1, filter.PageNumber);
        filter.PageSize = Math.Clamp(filter.PageSize, 1, 100);
        return Ok(new ApiResponse<object> { IsSuccess = true, Data = await categories.GetFilteredAsync(filter) });
    }

    [Authorize(Policy = "NotGuest")]
    [HttpGet("MyFarms")]
    public async Task<IActionResult> MyFarms([FromQuery] GetMyFarmDto filter)
    {
        filter.PageNumber = Math.Max(1, filter.PageNumber);
        filter.PageSize = Math.Clamp(filter.PageSize, 1, 100);
        return Ok(new ApiResponse<object> { IsSuccess = true, Data = await farms.GetMyFarmsAsync(filter) });
    }
}
