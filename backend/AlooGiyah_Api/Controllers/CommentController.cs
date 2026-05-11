using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Comment;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CommentController : ControllerBase
{
    #region Constructor
    private readonly ICommentService _commentService;

    public CommentController(ICommentService commentService)
    {
        _commentService = commentService;
    }
    #endregion


    #region CreateComment
    [Authorize(Policy = "NotGuest")]
    [HttpPost("Create")]
    public async Task<IActionResult> CreateComment(CommentCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _commentService.CreateAsync(createDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "نظر با موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    #region GetByFilter
    [Authorize]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilterAsync([FromQuery] CommentFilterDto filterDto)
    {
        var result = await _commentService.GetByFilterAsync(filterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullComment);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست نظرات با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetTreeComments
    [AllowAnonymous]
    [HttpGet("GetTreeComments")]
    public async Task<IActionResult> GetTreeCommentsAsync([FromQuery] CommentTreeFilterDto filterDto)
    {
        var result = await _commentService.GetTreeCommentsAsync(filterDto);

        if (result == null || !result.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullComment);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست نظرات با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetByCode
    [AllowAnonymous]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
    {
        var result = await _commentService.GetByCodeAsync(code);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullComment);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "نظر با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region UpdateComment
    [Authorize(Policy = "NotGuest")]
    [HttpPut("Update")]
    public async Task<IActionResult> UpdateComment(CommentUpdateDto updateDto)
    {
        var result = await _commentService.UpdateAsync(updateDto);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorCommentUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "نظر با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region DeleteComment
    [HttpDelete("Delete")]
    [Authorize(Policy = "NotGuest")]
    public async Task<IActionResult> DeleteComment([FromQuery] string code)
    {
        var result = await _commentService.DeleteAsync(code);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorCommentDelete);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "نظر با موفقیت حذف شد",
            Data = code
        });
    }
    #endregion
}