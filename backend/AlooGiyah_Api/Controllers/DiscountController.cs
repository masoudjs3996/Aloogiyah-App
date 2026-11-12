using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Discount;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DiscountController : ControllerBase
    {
        #region Constractor
        private readonly IDiscountService _discountService;

        public DiscountController(IDiscountService discountService)
        {
            _discountService = discountService;
        }
        #endregion


        #region CreateDiscount
        [Authorize(Roles = "Admin,Manager")]
        [HttpPost("CreateDiscount")]
        public async Task<IActionResult> CreateDiscount([FromBody] DiscountCreateDto createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (createDto.ForQualityAssessment && !User.IsInRole("Admin") && !User.IsInRole("Manager")) return Forbid();
            var result = await _discountService.CreateAsync(createDto);

            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "تخفیف با موفقیت ثبت شد",
                Data = result
            });
        }
        #endregion

        #region GetByFilter
        [Authorize]
        [HttpGet("GetByFilter")]
        public async Task<IActionResult> GetByFilterAsync([FromQuery] DiscountFilterDto filterDto)
        {
            var result = await _discountService.GetByFilterAsync(filterDto);

            if (result == null || !result.Items.Any())
                throw new NotFoundException(ErrorMessages.ErrorNullDiscount);

            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "لیست تخفیف‌ها با موفقیت دریافت شد",
                Data = result.Items
            });
        }
        #endregion

        #region GetByCode
        [Authorize]
        [HttpGet("GetByCode")]
        public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
        {
            var result = await _discountService.GetByCodeAsync(code);
            if (result == null)
                throw new NotFoundException(ErrorMessages.ErrorNullDiscount);

            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "تخفیف با موفقیت دریافت شد",
                Data = result
            });
        }
        #endregion

        #region UpdateDiscount
        [Authorize(Roles = "Admin,Manager")]
        [HttpPut("UpdateDiscount")]
        public async Task<IActionResult> UpdateDiscount(DiscountUpdateDto updateDto)
        {
            if (!User.IsInRole("Admin") && !User.IsInRole("Manager") &&
                (updateDto.ForQualityAssessment || (await _discountService.GetByCodeAsync(updateDto.Code))?.ForQualityAssessment == true)) return Forbid();
            var result = await _discountService.UpdateAsync(updateDto);

            if (!result)
                throw new NotFoundException(ErrorMessages.ErrorDiscountUpdate);

            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "تخفیف با موفقیت ویرایش شد",
                Data = result
            });
        }
        #endregion

        #region DeleteDiscount
        [Authorize(Roles = "Admin,Manager")]
        [HttpDelete("DeleteDiscount")]
        public async Task<IActionResult> DeleteDiscount([FromQuery] string code)
        {
            if (!User.IsInRole("Admin") && !User.IsInRole("Manager") && (await _discountService.GetByCodeAsync(code))?.ForQualityAssessment == true) return Forbid();
            var result = await _discountService.DeleteAsync(code);

            if (!result)
                throw new NotFoundException(ErrorMessages.ErrorDiscountDelete);

            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "تخفیف با موفقیت حذف شد",
                Data = code
            });
        }
        #endregion
    }
}
