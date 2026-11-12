using Microsoft.AspNetCore.RateLimiting;
﻿
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
    private readonly AlooGiyah_Api.BackgroundServices.ChatPushQueue _push;

    public ChatMessageController(IChatMessageService chatMessageService, ChatConnectionManager chatConnections, AlooGiyah_Api.BackgroundServices.ChatPushQueue push)
    {
        _chatMessageService = chatMessageService;
        _chatConnections = chatConnections;
        _push = push;
    }
    #endregion


    [Authorize(Policy = "NotGuest")]
    [HttpPost("SendFile")]
    [EnableRateLimiting("chat-file")]
    [RequestSizeLimit(52 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 52 * 1024 * 1024)]
    public async Task<IActionResult> SendFile([FromForm] string conversationCode, IFormFile file,
        [FromServices] AlooGiyah_Domain.Interfaces.IChatFileStorage storage,
        [FromForm] string? preview = null, [FromForm] Guid? uploadRequestId = null, [FromForm] string? caption = null,
        [FromForm] Guid? attachmentGroupId = null, [FromForm] int? attachmentGroupPosition = null)
    {
        var (result, created) = await _chatMessageService.CreateFileAsync(conversationCode, file, storage, preview,
            uploadRequestId, caption, attachmentGroupId, attachmentGroupPosition, HttpContext.RequestAborted);
        if (created)
        {
            _push.Enqueue(result);
            using var publishTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(4));
            await Task.WhenAll(
                _chatConnections.PublishMessageAsync(result.SenderCode, result, publishTimeout.Token),
                _chatConnections.PublishMessageAsync(result.ReceiverCode, result, publishTimeout.Token));
        }
        return Ok(new ApiResponse<ChatMessageDto> { IsSuccess = true, Data = result, Message = "فایل ارسال شد" });
    }

    [Authorize(Policy = "NotGuest")]
    [HttpGet("{code}/File")]
    public async Task<IActionResult> DownloadFile(string code,
        [FromServices] AlooGiyah_Domain.Interfaces.IChatFileStorage storage)
    {
        var file = await _chatMessageService.GetFileAsync(code);
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        Response.Headers["Cache-Control"] = "private, no-store";
        return File(storage.Open(file.Key), file.ContentType, file.Name, enableRangeProcessing: true);
    }

    #region CreateChatMessage
    [Authorize(Policy = "NotGuest")]
    [HttpPost("Create")]
    [EnableRateLimiting("chat-send")]
    public async Task<IActionResult> CreateChatMessage(ChatMessageCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _chatMessageService.CreateAsync(createDto);
        _push.Enqueue(result);
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
    [Authorize(Policy = "NotGuest"), HttpPost("DeleteMany"), EnableRateLimiting("chat-send")]
    public async Task<IActionResult> DeleteMany(ChatMessageDeleteManyDto input)
    {
        var messages = await _chatMessageService.DeleteManyAsync(input.Codes);
        foreach (var message in messages)
            await Task.WhenAll(
                _chatConnections.PublishMessageAsync(message.SenderCode, message, HttpContext.RequestAborted),
                _chatConnections.PublishMessageAsync(message.ReceiverCode, message, HttpContext.RequestAborted));
        return Ok(new ApiResponse<string[]> { IsSuccess = true, Data = messages.Select(x => x.Code).ToArray(), Message = "پیام‌های انتخاب‌شده حذف شدند" });
    }

    [Authorize]
    [HttpDelete("Delete")]
    public async Task<IActionResult> DeleteChatMessage([FromQuery] string code)
    {
        var message = await _chatMessageService.GetByCodeAsync(code);
        var result = await _chatMessageService.DeleteAsync(code);

        if (!result)
            throw new NotFoundException(ErrorMessages.ErrorChatMessageDelete);

        if (message != null) {
            message.IsDeleted = true;
            await Task.WhenAll(
                _chatConnections.PublishMessageAsync(message.SenderCode, message, HttpContext.RequestAborted),
                _chatConnections.PublishMessageAsync(message.ReceiverCode, message, HttpContext.RequestAborted));
        }

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "پیام با موفقیت حذف شد",
            Data = code
        });
    }
    #endregion

    [Authorize(Policy = "NotGuest"), HttpPost("{code}/Forward"), EnableRateLimiting("chat-send")]
    public async Task<IActionResult> Forward(string code, ChatForwardInput input)
    {
        var message = await _chatMessageService.ForwardAsync(code, input.ConversationCode);
        _push.Enqueue(message);
        await Task.WhenAll(
            _chatConnections.PublishMessageAsync(message.SenderCode, message, HttpContext.RequestAborted),
            _chatConnections.PublishMessageAsync(message.ReceiverCode, message, HttpContext.RequestAborted));
        return Ok(new ApiResponse<ChatMessageDto> { IsSuccess = true, Data = message });
    }

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
    [EnableRateLimiting("chat-room")]
    public async Task<IActionResult> GetOrCreateConversation([FromQuery] string receiverCode)
    {
        var result = await _chatMessageService.PrepareConversationAsync(receiverCode);
        result.PeerOnline = !result.IsBlocked && _chatConnections.IsUserOnline(result.PeerCode);
        return Ok(new ApiResponse<ChatConversationDto> { IsSuccess = true, Message = "گفت‌وگو آماده است", Data = result });
    }

    [Authorize(Policy = "NotGuest")]
    [HttpGet("GetConversationInfo")]
    public async Task<IActionResult> GetConversationInfo([FromQuery] string conversationCode)
    {
        var result = await _chatMessageService.GetConversationInfoAsync(conversationCode);
        if (result == null) throw new NotFoundException("گفت‌وگو پیدا نشد.");
        result.PeerOnline = !result.IsBlocked && _chatConnections.IsUserOnline(result.PeerCode);
        return Ok(new ApiResponse<ChatConversationDto> { IsSuccess = true, Message = "گفت‌وگو دریافت شد", Data = result });
    }

    [Authorize(Policy = "NotGuest"), HttpPut("{conversationCode}/Block"), EnableRateLimiting("chat-room")]
    public async Task<IActionResult> SetBlocked(string conversationCode, [FromBody] BlockInput input)
    {
        var room = await _chatMessageService.SetConversationBlockedAsync(conversationCode, input.Blocked);
        if (input.Blocked) _chatConnections.ForgetRoom(room);
        return Ok(new ApiResponse<bool> { IsSuccess = true, Data = true });
    }

    public sealed record BlockInput(bool Blocked);
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
