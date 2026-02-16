using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Slider;
using AlooGiyah_Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SliderController : ControllerBase
    {
        private readonly ISliderService _sliderService;

        public SliderController(ISliderService sliderService)
        {
            _sliderService = sliderService;
        }

        #region Create Slider
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromForm] CreateSliderDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _sliderService.CreateSliderAsync(dto);

            return Ok(new ApiResponse<SliderDto>
            {
                IsSuccess = true,
                Message = "اسلایدر با موفقیت ایجاد شد.",
                Data = result
            });
        }
        #endregion

        #region Get Active Sliders (Public)
        [AllowAnonymous]
        [HttpGet("GetActive")]
        public async Task<IActionResult> GetActive()
        {
            var result = await _sliderService.GetActiveSlidersAsync();

            return Ok(new ApiResponse<IEnumerable<SliderDto>>
            {
                IsSuccess = true,
                Message = "لیست اسلایدرها دریافت شد.",
                Data = result
            });
        }
        #endregion

        #region Delete Slider
        [HttpDelete("Delete")]
        public async Task<IActionResult> Delete(string code)
        {
            await _sliderService.DeleteSliderAsync(code);

            return Ok(new ApiResponse<string>
            {
                IsSuccess = true,
                Message = "اسلایدر با موفقیت حذف شد.",
                Data = code
            });
        }
        #endregion
    }
}
