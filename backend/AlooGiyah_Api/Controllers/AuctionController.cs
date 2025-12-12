using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Auction;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuctionController : ControllerBase
{
    #region Constructor
    private readonly IAuctionService _auctionService;

    public AuctionController(IAuctionService auctionService)
    {
        _auctionService = auctionService;
    }
    #endregion


    #region CreateAuction
    [Authorize(Roles = "Admin,Manager,Farmer")]
    [HttpPost("CreateAuction")]
    public async Task<IActionResult> CreateAuction(AuctionCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _auctionService.CreateAsync(createDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "حراج با موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    #region GetByFilter
    [Authorize]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilterAsync([FromQuery] AuctionFilterDto filterDto)
    {
        var result = await _auctionService.GetByFilterAsync(filterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullAuction);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست حراج‌ها با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetByCode
    [Authorize]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
    {
        var result = await _auctionService.GetByCodeAsync(code);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullAuction);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "حراج با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region UpdateAuction
    [Authorize(Roles = "Admin,Manager,Farmer")]
    [HttpPut("UpdateAuction")]
    public async Task<IActionResult> UpdateAuction(AuctionUpdateDto updateDto)
    {
        var result = await _auctionService.UpdateAsync(updateDto);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorAuctionUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "حراج با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region DeleteAuction
    [Authorize(Roles = "Admin,Manager,Farmer")]
    [HttpDelete("DeleteAuction")]
    public async Task<IActionResult> DeleteAuction([FromQuery] string code)
    {
        var result = await _auctionService.DeleteAsync(code);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorAuctionDelete);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "حراج با موفقیت حذف شد",
            Data = code
        });
    }
    #endregion

    #region FinalizeAuction
    [Authorize(Roles ="Admin,Manager")]
    [HttpPost("FinalizeAuction")]
    public async Task<IActionResult> FinalizeAuction([FromQuery] string code)
    {
        var result = await _auctionService.FinalizeAuctionAsync(code);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorAuctionFinalize);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "حراج با موفقیت نهایی شد",
            Data = code
        });
    }
    #endregion
}