using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    #region Constructor
    private readonly IUserService _userService;
    private readonly IAuthService _authService;
    public AuthController(IUserService userService, IAuthService authService)
    {
        _userService = userService;
        _authService = authService;
    }
    #endregion


    #region Register
    [Authorize]
    [HttpPost("Register")]
    public async Task<IActionResult> Register([FromBody] RegisterUserDto userDto)
    {
        if(!ModelState.IsValid)
            return BadRequest(ModelState);

        var (accessToken, refreshToken) = await _authService.RegisterUserAsync(userDto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "ثبت‌نام با موفقیت انجام شد.",
            Data = new
            {
                Token = $"Bearer {accessToken}",
                RefreshToken = refreshToken.Token,
                refreshToken.Expires
            }
        });
    }
    #endregion

    #region Login
    [Authorize]
    [HttpPost("Login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        var (accessToken, refreshToken) = await _authService.LoginUserAsync(loginDto);

        if (accessToken == null || refreshToken == null)
            return BadRequest(new ApiResponse<object>
            {
                IsSuccess = false,
                Message = "ورود ناموفق بود. لطفاً اطلاعات را بررسی کنید."
            });

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "ورود موفقیت‌آمیز بود.",
            Data = new
            {
                Token = $"Bearer {accessToken}",
                RefreshToken = refreshToken.Token,
                refreshToken.Expires
            }
        });
    }
    #endregion

    #region Refresh Token
    [AllowAnonymous]
    [HttpPost("RefreshToken")]
    public async Task<IActionResult> RefreshToken([FromBody] string RefreshToken)
    {
        try
        {

        var (newAccessToken, newRefreshToken) = await _authService.RefreshAccessTokenAsync(RefreshToken);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "توکن جدید صادر شد.",
            Data = new
            {
                Token = $"Bearer {newAccessToken}",
                RefreshToken = newRefreshToken.Token,
                newRefreshToken.Expires
            }
        });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new ApiResponse<object>
            {
                IsSuccess = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<object>
            {
                IsSuccess = false,
                Message = "خطایی رخ داد. لطفاً دوباره تلاش کنید."
            });
        }
    }
    #endregion

    #region Guest Token
    [AllowAnonymous]
    [HttpPost("GuestToken")]
    public IActionResult CreateGuestToken()
    {
        var guestToken = _authService.GenerateGuestToken();

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "توکن مهمان با موفقیت ساخته شد.",
            Data = new
            {
                Token = $"Bearer {guestToken}"
            }
        });
    }
    #endregion
    #region ChangePassword
    [Authorize]
    [HttpPatch("ChangePassword")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto PasswordDto)
    {
        var result = await _authService.ChangePasswordAsync(PasswordDto);

        if (!result)
            throw new BadRequestException(ErrorMessages.PasswordChangeFailed);

        return Ok(new ApiResponse<ChangePasswordDto>
        {
            IsSuccess = true,
            Message = "پسورد با موفقت تغییر کرد",
            Data = PasswordDto
        });
    }
    #endregion

    #region SendVerificationCodeEmail
    [Authorize]
    [HttpPost("SendVerificationCodeEmail")]
    public async Task<IActionResult> SendVerificationCode()
    {
        var result = await _authService.SendEmailVerificationCodeAsync();
        if (!result)
            throw new BadRequestException(ErrorMessages.VerificationCodeFailed);

        return Ok(new ApiResponse<Object>
        {
            IsSuccess = true,
            Message = "کد تایید با موفقیت ارسال شد",
        });
    }
    #endregion

    #region VerifyEmail
    [Authorize]
    [HttpPatch("VerifyEmail")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto dto)
    {
        var result = await _authService.VerifyEmailAsync(dto);
        if (!result)
            throw new BadRequestException(ErrorMessages.EmailVerificationFailed);

        return Ok(new ApiResponse<VerifyEmailDto>
        {
            IsSuccess = true,
            Message = "ایمیل با موفقیت تایید شد",
            Data = dto
        });
    }
    #endregion

    #region Send Reset Password Code
    [AllowAnonymous]
    [HttpPost("SendResetPasswordCode")]
    public async Task<IActionResult> SendPasswordResetCode([FromBody] ResetPasswordRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))
            return BadRequest(new ApiResponse<string> { IsSuccess = false, Message = "ایمیل یا کد کاربری الزامی است." });

        var result = await _authService.SendPasswordResetCodeAsync(dto.Code);
        if (!result)
            throw new NotFoundException(ErrorMessages.PasswordResetCodeFailed);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "کد بازیابی کلمه عبور با موفقیت ارسال شد",
            Data = null
        });
    }
    #endregion

    #region reset Password forget
    [AllowAnonymous]
    [HttpPatch("resetPassword")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var result = await _authService.ResetPasswordAsync(dto);
        if (!result)
            throw new BadRequestException(ErrorMessages.PasswordResetFailed);

        return Ok(new ApiResponse<ResetPasswordDto>
        {
            IsSuccess = true,
            Message = "پسورد با موفقیت تغییر کرد",
            Data = dto
        });
    }
    #endregion

    #region ChangeUsername
    [Authorize]
    [HttpPatch("ChangeUsername")]
    public async Task<IActionResult> ChangeUsername([FromBody] ChangeUsernameDto UsernameDto)
    {
        var result = await _authService.ChangeUsernameAsync(UsernameDto);

        if (!result)
            throw new BadRequestException(ErrorMessages.UsernameChangeFailed);

        return Ok(new ApiResponse<ChangeUsernameDto>
        {
            IsSuccess = true,
            Message = "یوزرنیم با موفقت تغییر کرد",
            Data = UsernameDto
        });
    }
    #endregion

}
