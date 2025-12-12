using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Application.Interfaces.UserFolder;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UserController : ControllerBase
{

    #region Constructor
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }
    #endregion


    #region GetUser
    [Authorize(Roles ="Manager")]
    [HttpGet("GetUserByCode")]
    public async Task<IActionResult> GetUserByCode(string? code)
    {
        var users = await _userService.GetUserByCode(code);
        if(users == null)
            throw new NotFoundException(ErrorMessages.UserNotFound);
        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = " کاربر با موفقیت دریافت شد",
            Data = users
        });
    }
    #endregion

    #region GetUserByFilter
    [Authorize(Roles = "Manager")]
    [HttpGet("GetUserByFilter")]
    public async Task<IActionResult> GetUserByFilterAsync(UserFilterDto userFilter)
    {
        var users = await _userService.GetUserByFilterAsync(userFilter);
        if (users == null)
            throw new NotFoundException(ErrorMessages.UserNotFound);
        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست کاربران با موفقیت دریافت شد",
            Data = users
        });
    }
    #endregion

    #region GetMyProfile
    [Authorize]
    [HttpGet("GetMyProfile")]
    public async Task<IActionResult> GetMyProfileAsync()
    {
        var users = await _userService.GetMyProfileAsync();
        if (users == null)
            throw new NotFoundException(ErrorMessages.UserNotFound);
        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "پروفایل با موفقیت دریافت شد",
            Data = users
        });
    }
    #endregion

    #region UpdateProfile
    [Authorize]
    [HttpPut("UpdateProfile")]
    public async Task<IActionResult> UpdateUser([FromBody] UpdateProfileDto userDto)
    {
        var result = await _userService.UpdateProfileAsync(userDto);
        if (result == null)
            throw new NotFoundException(ErrorMessages.UserNotFound);

        return Ok(new ApiResponse<UserDto>
        {
            IsSuccess = true,
            Message = "اطلاعات با موفقیت بروز شد.",
            Data = result
        });
    }
    #endregion

    #region UploadProfileImage
    [Authorize]
    [HttpPost("UploadProfileImage")]
    public async Task<IActionResult> UploadProfileImage([FromForm] ChangeProfilePhotoDto file)
    {
        var result = await _userService.ChangeProfilePhotoAsync(file);

        if (result == null)
            throw new NotFoundException(ErrorMessages.UserNotFound);

        return Ok(new ApiResponse<string>
        {
            IsSuccess = true,
            Message = "اطلاعات با موفقیت بروز شد.",
            Data = result
        });
    }
    #endregion
}