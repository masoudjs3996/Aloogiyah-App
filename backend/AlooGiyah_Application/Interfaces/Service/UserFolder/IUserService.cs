using Microsoft.AspNetCore.Http;
using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service.UserFolder;

public interface IUserService
{
    Task<UserDto> GetUserByCode(string? code);
    Task<ProfileResponseDto> GetMyProfileAsync();
    Task<PagedResult<UserDto>> GetUserByFilterAsync(UserFilterDto filter);
    CurrentUserRoleDto GetCurrentUserRole();
    Task<UserDto> UpdateProfileAsync(UpdateProfileDto userDto);
    Task<string?> ChangeProfilePhotoAsync(ChangeProfilePhotoDto file);
    Task<RegisterUserDto> GetUserByUsername(string username);
    Task SetAdditionalRolesAsync(string userCode, IReadOnlyCollection<string> roleCodes);

}
