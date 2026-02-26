using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.UserFolder;
namespace AlooGiyah_Application.Interfaces.Service.UserFolder;

public interface IAuthService
{
    Task<(string accessToken, RefreshToken refreshToken)> RegisterUserAsync(RegisterUserDto dto);
    Task<(string newAccessToken, RefreshToken newRefreshToken)> RefreshAccessTokenAsync(string refreshToken);
    Task<(string accessToken, RefreshToken refreshToken)> LoginUserAsync(LoginDto loginDto);
    string GenerateAccessToken(User user);
    RefreshToken GenerateRefreshToken();
    string GenerateGuestToken();
    Task<bool> ChangeUsernameAsync(ChangeUsernameDto model);
    Task<bool> ChangePasswordAsync(ChangePasswordDto model);
    Task<bool> VerifyEmailAsync(VerifyEmailDto verifyEmail);
    Task<bool> SendEmailVerificationCodeAsync();
    Task<bool> SendPasswordResetCodeAsync(string email);
    Task<bool> ResetPasswordAsync(ResetPasswordDto model);
}
