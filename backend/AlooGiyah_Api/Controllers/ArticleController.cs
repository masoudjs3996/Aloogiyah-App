using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Article;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ArticleController : ControllerBase
{
    #region Constructor
    private readonly IArticleService _articleService;

    public ArticleController(IArticleService articleService)
    {
        _articleService = articleService;
    }
    #endregion


    #region CreateArticle
    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("CreateArticle")]
    public async Task<IActionResult> CreateArticle(ArticleCreateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _articleService.CreateAsync(dto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "مقاله با موفقیت ایجاد شد",
            Data = result
        });
    }
    #endregion

    #region UpdateArticle
    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("UpdateArticle")]
    public async Task<IActionResult> UpdateArticle(ArticleUpdateDto dto)
    {
        var result = await _articleService.UpdateAsync(dto);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorArticleUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "مقاله با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region GetArticlesByFilter
    [Authorize]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilter([FromQuery] ArticleFilterDto filter)
    {
        var result = await _articleService.GetByFilterAsync(filter);

        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullArticle);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست مقالات با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetArticleByCode
    [Authorize]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCode([FromQuery] string code)
    {
        var result = await _articleService.GetByCodeAsync(code);

        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullArticle);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "مقاله با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region DeleteArticle
    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("DeleteArticle")]
    public async Task<IActionResult> DeleteArticle([FromQuery] string code)
    {
        var result = await _articleService.DeleteAsync(code);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorDeleteArticle);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "مقاله با موفقیت حذف شد",
            Data = code
        });
    }
    #endregion
}
