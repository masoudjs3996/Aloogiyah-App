using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Auction;
using AlooGiyah_Application.DTOs.AuctionBid;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuctionBidController : ControllerBase
{
    #region Constructor
    private readonly IAuctionBidService _auctionBidService;

    public AuctionBidController(IAuctionBidService auctionBidService)
    {
        _auctionBidService = auctionBidService;
    }
    #endregion


    #region CreateAuctionBid
    [Authorize]
    [HttpPost("CreateAuctionBid")]
    public async Task<IActionResult> CreateAuctionBid([FromBody] AuctionBidCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _auctionBidService.CreateAsync(createDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "پیشنهاد حراج با موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    #region GetByFilter
    [Authorize]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilterAsync([FromQuery] AuctionBidFilterDto filterDto)
    {
        var result = await _auctionBidService.GetByFilterAsync(filterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullAuctionBid);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست پیشنهادهای حراج با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetByCode
    [Authorize]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
    {
        var result = await _auctionBidService.GetByCodeAsync(code);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullAuctionBid);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "پیشنهاد حراج با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region UpdateAuctionBid
    [Authorize]
    [HttpPut("UpdateAuctionBid")]
    public async Task<IActionResult> UpdateAuctionBid(AuctionBidUpdateDto updateDto)
    {
        var result = await _auctionBidService.UpdateAsync(updateDto);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorAuctionBidUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "پیشنهاد حراج با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region DeleteAuctionBid
    [Authorize(Roles ="Admin,Maneger")]
    [HttpDelete("DeleteAuctionBid")]
    public async Task<IActionResult> DeleteAuctionBid([FromQuery] string code)
    {
        var result = await _auctionBidService.DeleteAsync(code);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorAuctionBidDelete);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "پیشنهاد حراج با موفقیت حذف شد",
            Data = code
        });
    }
    #endregion
}