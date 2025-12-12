using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.StatusChangeLog;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StatusChangeLogController : ControllerBase
    {
        #region Constractor
        private readonly IStatusChangeLogService _statusChangeLogService;

        public StatusChangeLogController(IStatusChangeLogService statusChangeLogService)
        {
            _statusChangeLogService = statusChangeLogService;
        }
        #endregion


        #region Create
        [Authorize(Roles = "Admin,Manager")]
        [HttpPost("Create")]
        public async Task<IActionResult> CreateStatusChangeLog(StatusChangeLogCreateDto createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _statusChangeLogService.CreateAsync(createDto);

            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "لاگ تغییر وضعیت با موفقیت ثبت شد",
                Data = result
            });
        }
        #endregion

        #region GetByFilter
        [Authorize(Roles = "Admin,Manager")]
        [HttpGet("GetByFilter")]
        public async Task<IActionResult> GetByFilterAsync([FromQuery] StatusChangeLogFilterDto filterDto)
        {
            var result = await _statusChangeLogService.GetByFilterAsync(filterDto);

            if (result == null || !result.Items.Any())
                throw new NotFoundException(ErrorMessages.ErrorNullStatusChangeLog);

            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "لیست لاگ‌های تغییر وضعیت با موفقیت دریافت شد",
                Data = result
            });
        }
        #endregion

        #region GetByCode
        [Authorize(Roles =("Admin,Manager"))]
        [HttpGet("GetByCode")]
        public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
        {
            var result = await _statusChangeLogService.GetByCodeAsync(code);
            if (result == null)
                throw new NotFoundException(ErrorMessages.ErrorNullStatusChangeLog);

            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "لاگ تغییر وضعیت با موفقیت دریافت شد",
                Data = result
            });
        }
        #endregion

        #region Update
        [Authorize(Roles ="Admin,Manager")]
        [HttpPut("Update")]
        public async Task<IActionResult> UpdateStatusChangeLog(StatusChangeLogUpdateDto updateDto)
        {
            var result = await _statusChangeLogService.UpdateAsync(updateDto);

            if (!result)
                throw new NotFoundException(ErrorMessages.ErrorStatusChangeLogUpdate);

            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "لاگ تغییر وضعیت با موفقیت ویرایش شد",
                Data = result
            });
        }
        #endregion

        #region Delete
        [Authorize(Roles ="Admin,Manager")]
        [HttpDelete("Delete")]
        public async Task<IActionResult> DeleteStatusChangeLog([FromQuery] string code)
        {
            var result = await _statusChangeLogService.DeleteAsync(code);

            if (!result)
                throw new NotFoundException(ErrorMessages.ErrorStatusChangeLogDelete);

            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "لاگ تغییر وضعیت با موفقیت حذف شد",
                Data = code
            });
        }
        #endregion
    }
}
