using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Application.Services.Store;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AgriculturalProductController : ControllerBase
{
    #region Constructor
    private readonly IAgriculturalProductService _agriculturalProductService;

    public AgriculturalProductController(IAgriculturalProductService agriculturalProductService)
    {
        _agriculturalProductService = agriculturalProductService;
    }
    #endregion


    #region CreateAgriculturalProduct
    [Authorize(Roles = "Admin,Manager,Farmer")]
    [HttpPost("Create")]
    public async Task<IActionResult> CreateAgriculturalProduct(AgriculturalProductCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _agriculturalProductService.CreateAsync(createDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "محصول کشاورزی با موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    #region CreateWithImages
    [Authorize(Roles = "Admin,Farmer")]
    [HttpPost("CreateWithImages")]
    public async Task<IActionResult> CreateWithImages([FromForm] AgriculturalProductCreateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var result = await _agriculturalProductService.CreateWithImageAsync(dto);

            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "محصول همراه با عکس‌ها با موفقیت ایجاد شد",
                Data = result
            });
        }
        catch (Exception ex)
        {
            // اینجا می‌تونی لاگ کنی
            return BadRequest(new ApiResponse<string>
            {
                IsSuccess = false,
                Message = "خطا در ایجاد محصول: " + ex.Message,
                Data = null
            });
        }
    }
    #endregion

    #region GetByFilter
    [AllowAnonymous]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilterAsync([FromQuery] AgriculturalProductFilterDto filterDto)
    {
        var result = await _agriculturalProductService.GetByFilterAsync(filterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullAgriculturalProduct);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست محصولات کشاورزی با موفقیت دریافت شد",
            Data = result.Items
        });
    }
    #endregion

    #region GetByCode
    [AllowAnonymous]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
    {
        var result = await _agriculturalProductService.GetByCodeAsync(code);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullAgriculturalProduct);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "محصول کشاورزی با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region UpdateAgriculturalProduct
    [Authorize(Roles = "Admin,Manager,Farmer")]
    [HttpPut("Update")]
    public async Task<IActionResult> UpdateAgriculturalProduct(AgriculturalProductUpdateDto updateDto)
    {
        var result = await _agriculturalProductService.UpdateAsync(updateDto);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorAgriculturalProductUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "محصول کشاورزی با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region DeleteAgriculturalProduct
    [Authorize(Roles = "Admin,Manager,Farmer")]
    [HttpDelete("Delete")]
    public async Task<IActionResult> DeleteAgriculturalProduct([FromQuery] string code)
    {
        var result = await _agriculturalProductService.DeleteAsync(code);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorAgriculturalProductDelete);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "محصول کشاورزی با موفقیت حذف شد",
            Data = code
        });
    }
    #endregion

    #region Add Images to Product
    [Authorize(Roles = "Admin,Farmer,Manager")]
    [HttpPost("AddImages")]
    public async Task<IActionResult> AddImages([FromQuery] string productCode, [FromForm] List<IFormFile> files)
    {
        if (files == null || !files.Any())
            return BadRequest(new ApiResponse<string>
            {
                IsSuccess = false,
                Message = "حداقل یک عکس باید ارسال شود",
                Data = null
            });

        var dto = new AddProductImagesDto
        {
            ProductCode = productCode,
            Files = files
        };

        var uploadedUrls = await _agriculturalProductService.AddProductImagesAsync(dto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = $"{uploadedUrls.Count} عکس با موفقیت به محصول اضافه شد",
            Data = new
            {
                UploadedImageUrls = uploadedUrls,
                Note = uploadedUrls.Count > 0 && uploadedUrls.Count == files.Count
                       ? "در صورت عدم وجود عکس قبلی، اولین عکس به عنوان عکس اصلی تنظیم شد"
                       : ""
            }
        });
    }
    #endregion

    #region Set Primary Image
    [Authorize(Roles = "Admin,Farmer,Manager")]
    [HttpPatch("SetPrimaryImage")]
    public async Task<IActionResult> SetPrimaryImage([FromQuery]string productCode, [FromBody] SetPrimaryProductImageDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var primaryUrl = await _agriculturalProductService.SetPrimaryProductImageAsync(productCode, dto.FileCode);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "عکس اصلی محصول با موفقیت تغییر کرد",
            Data = new { PrimaryImageUrl = primaryUrl }
        });
    }
    #endregion

    #region Remove Image
    [Authorize(Roles = "Admin,Farmer,Manager")]
    [HttpDelete("RemoveImage")]
    public async Task<IActionResult> RemoveImage([FromQuery] string productCode, string fileCode)
    {
        await _agriculturalProductService.RemoveProductImageAsync(productCode, fileCode);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "عکس با موفقیت حذف شد",
            Data = null
        });
    }
    #endregion
}