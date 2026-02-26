using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.File;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FileController : ControllerBase
    {
        #region Constructor
        private readonly IFileService _fileService;

        public FileController(IFileService fileService)
        {
            _fileService = fileService;
        }
        #endregion


        #region UploadFile
        [Authorize]
        [HttpPost("UploadFile")]
        public async Task<IActionResult> Upload([FromForm] FileUploadDto dto)
        {
            var result = await _fileService.UploadFileAsync(dto);

            if (result == null)
                throw new NotFoundException(ErrorMessages.ErrorAddFile);

            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "فایل با موفقیت ذخیره شد",
                Data = result
            });
        }
        #endregion

        #region GetFiles
        [Authorize]
        [HttpGet("GetFiles")]
        public async Task<IActionResult> GetFiles([FromQuery] FileFilterDto filter)
        {
            var result = await _fileService.GetFilesAsync(filter);
            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "فایل‌ها با موفقیت دریافت شدند",
                Data = new
                {
                    Files = result.Items,
                    result.TotalCount,
                    result.PageNumber,
                    result.PageSize
                }
            });
        }
        #endregion

        #region DeleteFile
        [Authorize]
        [HttpDelete("DeleteFile")]
        public async Task<IActionResult> DeleteFileByCode([FromQuery]string fileCode)
        {
            await _fileService.DeleteFileByCodeAsync(fileCode);

            return Ok(new ApiResponse<string>
            {
                IsSuccess = true,
                Message = "فایل با موفقیت حذف شد",
                Data = fileCode
            });
        }
        #endregion
    }
}
