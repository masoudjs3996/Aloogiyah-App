using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.ChatMessage;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ChatMessageController : ControllerBase
{
    #region Constructor
    private readonly IChatMessageService _chatMessageService;

    public ChatMessageController(IChatMessageService chatMessageService)
    {
        _chatMessageService = chatMessageService;
    }
    #endregion


    #region CreateChatMessage
    [Authorize]
    [HttpPost("Create")]
    public async Task<IActionResult> CreateChatMessage(ChatMessageCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _chatMessageService.CreateAsync(createDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "پیام با موفقیت ارسال شد",
            Data = result
        });
    }
    #endregion

    #region GetByFilter
    [Authorize]
    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilterAsync([FromQuery] ChatMessageFilterDto filterDto)
    {
        var result = await _chatMessageService.GetByFilterAsync(filterDto);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullChatMessage);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست پیام‌ها با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetByCode
    [Authorize]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync([FromQuery] string code)
    {
        var result = await _chatMessageService.GetByCodeAsync(code);
        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullChatMessage);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "پیام با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region UpdateChatMessage
    [Authorize]
    [HttpPut("Update")]
    public async Task<IActionResult> UpdateChatMessage(ChatMessageUpdateDto updateDto)
    {
        var result = await _chatMessageService.UpdateAsync(updateDto);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorChatMessageUpdate);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "پیام با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region DeleteChatMessage
    [Authorize]
    [HttpDelete("Delete")]
    public async Task<IActionResult> DeleteChatMessage([FromQuery] string code)
    {
        var result = await _chatMessageService.DeleteAsync(code);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorChatMessageDelete);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "پیام با موفقیت حذف شد",
            Data = code
        });
    }
    #endregion

    #region GetConversation
    [Authorize]
    [HttpGet("GetConversation")]
    public async Task<IActionResult> GetConversationAsync([FromQuery] string userCode1, [FromQuery] string userCode2, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _chatMessageService.GetConversationAsync(userCode1, userCode2, pageNumber, pageSize);

        if (result == null || !result.Items.Any())
            throw new NotFoundException(ErrorMessages.ErrorNullChatMessage);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "مکالمه با موفقیت دریافت شد",
            Data = result
        });
    }
    #endregion
}