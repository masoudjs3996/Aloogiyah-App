using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Product;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProductController : ControllerBase
{
    #region Constructor
    private readonly IProductService _productService;

    public ProductController(IProductService productService)
    {
        _productService = productService;
    }
    #endregion


    #region CreateProduct
    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("CreateProduct")]
    public async Task<IActionResult> CreateProduct(ProductCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _productService.CreateAsync(createDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "محصول با موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    #region GetByFilter
    [Authorize]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilterAsync([FromQuery] ProductFilterDto filterDto)
    {
        var result = await _productService.GetByFilterAsync(filterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullProduct);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست محصولات با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetByCode
    [Authorize]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
    {
        var result = await _productService.GetByCodeAsync(code);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullProduct);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "محصول با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region UpdateProduct
    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("UpdateProduct")]
    public async Task<IActionResult> UpdateProduct(ProductUpdateDto updateDto)
    {
        var result = await _productService.UpdateAsync(updateDto);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorProductUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "محصول با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region DeleteProduct
    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("DeleteProduct")]
    public async Task<IActionResult> DeleteProduct([FromQuery] string code)
    {
        var result = await _productService.DeleteAsync(code);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorProductDelete);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "محصول با موفقیت حذف شد",
            Data = code
        });
    }
    #endregion
}
