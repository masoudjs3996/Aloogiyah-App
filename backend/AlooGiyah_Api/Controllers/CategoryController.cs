using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Category;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CategoryController : ControllerBase
{
    #region Constructor
    private readonly ICategoryService _categoryService;
    public CategoryController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }
    #endregion


    #region CreateCategory
    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("Create")]
    public async Task<IActionResult> CreateCategory(CategoryCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _categoryService.CreateAsync(createDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "دسته‌بندی با موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    #region GetByFilter
    [AllowAnonymous]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilterAsync([FromQuery] CategoryFilterDto filterDto)
    {
        var result = await _categoryService.GetFilteredAsync(filterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullCategory);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست دسته‌بندی‌ها با موفقیت دریافت شد",
            Data = result.Items,
        });
    }
    #endregion

    #region GetByCode
    [AllowAnonymous]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
    {
        var result = await _categoryService.GetByCodeAsync(code);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullCategory);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "دسته‌بندی با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetHomePage
    [AllowAnonymous]
    [HttpGet("GetCategoriesByType")]
    public async Task<IActionResult> GetCategoriesByTypeAsync(CategoryFetchType type)
    {
        var result = await _categoryService.GetCategoriesByTypeAsync(type);
        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست دسته‌بندی‌ها با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region CategoryTree
    [AllowAnonymous]
    [HttpGet("CategoryTree")]
    public async Task<IActionResult> GetCategoryTreeAsync()
    {
        var result = await _categoryService.GetCategoryTreeAsync();


        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست دسته‌بندی‌ها با موفقیت دریافت شد",
            Data = result,
        });
    }
    #endregion

    #region UpdateCategory
    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("Update")]
    public async Task<IActionResult> UpdateCategory(CategoryUpdateDto updateDto)
    {
        var result = await _categoryService.UpdateAsync(updateDto);

        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorAddressUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "دسته‌بندی با موفقیت ویرایش شد",
            Data = result,
        });
    }
    #endregion

    #region UploadCategoryImage
    [HttpPost("UploadImage")]
    [Authorize(Roles = "Admin")]  // فقط ادمین بتونه
    public async Task<IActionResult> UploadCategoryImage([FromForm] UploadCategoryImageDto dto)
    {
        var newUrl = await _categoryService.ChangeCategoryImageAsync(dto);

        return Ok(new
        {
            message = "عکس دسته‌بندی با موفقیت آپلود شد",
            imageUrl = newUrl
        });
    }
    #endregion

    #region DeleteCategory
    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("{code}")]
    public async Task<IActionResult> DeleteCategory(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return BadRequest(new ApiResponse<string>
            {
                IsSuccess = false,
                Message = "کد دسته‌بندی معتبر نیست",
                Data = null
            });

        var result = await _categoryService.LogicalDeleteAsync(code);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorCategoryDeleteFailed);

        return Ok(new ApiResponse<string>
        {
            IsSuccess = true,
            Message = "دسته‌بندی با موفقیت حذف شد",
            Data = code
        });
    }

    #endregion
}

