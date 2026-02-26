using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.File;
using AlooGiyah_Application.DTOs.Location;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_WebApi.Controllers
{
    [ApiController]
    [Route("api/location")]
    public class LocationController : ControllerBase
    {
        private readonly ILocationService _locationService;

        public LocationController(ILocationService locationService)
        {
            _locationService = locationService;
        }

        // استان‌ها
        [HttpGet("Provinces")]
        public async Task<IActionResult> GetProvinces([FromQuery] LocationFilterDto filter)
        {
            var result = await _locationService.GetProvincesAsync(filter);

            return Ok(new ApiResponse<List<ProvinceListDto>>
            {
                IsSuccess = true,
                Message = "لیست استان‌ها دریافت شد.",
                Data = result.Items.ToList()
            });
        }

        [HttpPost("Province")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateProvince([FromBody] ProvinceCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _locationService.CreateProvinceAsync(dto);
            return Ok(new ApiResponse<ProvinceDto>
            {
                IsSuccess = true,
                Message = "استان با موفقیت ایجاد شد.",
                Data = result
            });
        }

        // شهرستان‌ها
        [HttpGet("Counties")]
        [Authorize]
        public async Task<IActionResult> GetCounties([FromQuery] string? provinceCode, [FromQuery] LocationFilterDto filter)
        {
            var result = await _locationService.GetCountiesAsync(provinceCode, filter);
            return Ok(new ApiResponse<List<CountyDto>>
            {

                IsSuccess = true,
                Message = "لیست شهرستان ها با موفقیت دریافت شد",
                Data = result.Items.ToList()
            });
        }

        [HttpPost("County")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateCounty([FromBody] CountyCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _locationService.CreateCountyAsync(dto);

            return Ok(new ApiResponse<CountyDto>
            {
                IsSuccess = true,
                Message = "شهرستان ایجاد شد.",
                Data = result
            });

        }


        [HttpPost("City")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateCity([FromBody] CityCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            return Ok(new ApiResponse<CityDto>
            {
                IsSuccess = true,
                Message = "شهر با موفقیت ایجاد شد",
                Data = await _locationService.CreateCityAsync(dto)
            });

        }


        [HttpPost("Village")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateVillage([FromBody] VillageCreateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            return Ok(new ApiResponse<VillageDto>
            {
                IsSuccess = true,
                Message = "روستا با موفقیت ایجاد شد",
                Data = await _locationService.CreateVillageAsync(dto)
            });

        }

        [HttpGet("CityAndVillage")]
        [Authorize]
        public async Task<IActionResult> GetCountyLocations([FromQuery] CountyLocationsFilterDto filterDto)
        {

            var locations = await _locationService.GetCountyLocationsAsync(filterDto);

            return Ok(new ApiResponse<List<CountyLocationItemDto>>
            {
                IsSuccess = true,
                Message = "مکان‌های شهرستان دریافت شد.",
                Data = locations
            });
        }
    }
}
