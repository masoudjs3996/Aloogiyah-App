using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.ChatMessage;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AlooGiyah_Api.Realtime;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ChatMessageController : ControllerBase
{
    #region Constructor
    private readonly IChatMessageService _chatMessageService;
    private readonly ChatConnectionManager _chatConnections;

    public ChatMessageController(IChatMessageService chatMessageService, ChatConnectionManager chatConnections)
    {
        _chatMessageService = chatMessageService;
        _chatConnections = chatConnections;
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
        await Task.WhenAll(
            _chatConnections.PublishMessageAsync(result.SenderCode, result, HttpContext.RequestAborted),
            _chatConnections.PublishMessageAsync(result.ReceiverCode, result, HttpContext.RequestAborted));

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

        if (result == null)
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

        var updated = await _chatMessageService.GetByCodeAsync(updateDto.Code);
        if (updated != null)
            await Task.WhenAll(
                _chatConnections.PublishMessageAsync(updated.SenderCode, updated, HttpContext.RequestAborted),
                _chatConnections.PublishMessageAsync(updated.ReceiverCode, updated, HttpContext.RequestAborted));

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
    public async Task<IActionResult> GetConversationAsync([FromQuery] string conversationCode, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 30)
    {
        var result = await _chatMessageService.GetConversationAsync(conversationCode, pageNumber, pageSize);

        if (result == null)
            throw new NotFoundException(ErrorMessages.ErrorNullChatMessage);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "مکالمه با موفقیت دریافت شد",
            Data = result
        });
    }

    [Authorize(Policy = "NotGuest")]
    [HttpPost("GetOrCreateConversation")]
    public async Task<IActionResult> GetOrCreateConversation([FromQuery] string receiverCode)
    {
        var result = await _chatMessageService.GetOrCreateConversationAsync(receiverCode);
        result.PeerOnline = _chatConnections.IsUserOnline(result.PeerCode);
        var currentCode = User.FindFirst("Code")?.Value;
        if (!string.IsNullOrWhiteSpace(currentCode))
            await Task.WhenAll(
                _chatConnections.PublishConversationAsync(currentCode, result, HttpContext.RequestAborted),
                _chatConnections.PublishConversationAsync(result.PeerCode, result, HttpContext.RequestAborted));
        return Ok(new ApiResponse<ChatConversationDto> { IsSuccess = true, Message = "گفت‌وگو آماده است", Data = result });
    }

    [Authorize(Policy = "NotGuest")]
    [HttpGet("GetConversationInfo")]
    public async Task<IActionResult> GetConversationInfo([FromQuery] string conversationCode)
    {
        var result = await _chatMessageService.GetConversationInfoAsync(conversationCode);
        if (result == null) throw new NotFoundException("گفت‌وگو پیدا نشد.");
        result.PeerOnline = _chatConnections.IsUserOnline(result.PeerCode);
        return Ok(new ApiResponse<ChatConversationDto> { IsSuccess = true, Message = "گفت‌وگو دریافت شد", Data = result });
    }
    #endregion

    [Authorize(Policy = "NotGuest")]
    [HttpGet("GetContact")]
    public async Task<IActionResult> GetContact([FromQuery] string code)
    {
        var result = await _chatMessageService.GetContactAsync(code);
        if (result == null)
            throw new NotFoundException("مخاطب گفت‌وگو پیدا نشد.");
        return Ok(new ApiResponse<ChatContactDto>
        {
            IsSuccess = true,
            Message = "اطلاعات مخاطب دریافت شد",
            Data = result
        });
    }

    [Authorize(Policy = "NotGuest")]
    [HttpGet("GetMyConversations")]
    public async Task<IActionResult> GetMyConversations()
    {
        var result = await _chatMessageService.GetConversationsAsync();
        return Ok(new ApiResponse<List<ChatConversationSummaryDto>>
        {
            IsSuccess = true,
            Message = "فهرست گفت‌وگوها دریافت شد",
            Data = result
        });
    }
}
