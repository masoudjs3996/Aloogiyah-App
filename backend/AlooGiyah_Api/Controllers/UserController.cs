using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Application.Interfaces.UserFolder;
using AlooGiyah_Application.Services.UserFolder;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ICurrentUserService _currentUser;
        public UserController(IUserService userService, ICurrentUserService currentUser)
        {
            _userService = userService ?? throw new ArgumentNullException(nameof(userService));
            _currentUser = currentUser;
        }

        #region GetUserByCode
        [Authorize(Roles = "Manager")]
        [HttpGet("GetUserByCode")]
        public async Task<IActionResult> GetUserByCode([FromQuery] string? code)
        {
            if (string.IsNullOrWhiteSpace(code))
                return BadRequest(new ApiResponse<object> { IsSuccess = false, Message = "کد کاربر الزامی است." });

            var user = await _userService.GetUserByCode(code);

            return Ok(new ApiResponse<UserDto>
            {
                IsSuccess = true,
                Message = "کاربر با موفقیت دریافت شد",
                Data = user
            });
        }
        #endregion

        // GET: api/User/GetUserByFilter?FName=علی&PageNumber=1&PageSize=10
        [Authorize(Roles = "Manager")]
        [HttpGet("GetUserByFilter")]
        public async Task<IActionResult> GetUserByFilterAsync([FromQuery] UserFilterDto userFilter)
        {
            var users = await _userService.GetUserByFilterAsync(userFilter);

            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = users.Items.Any() ? "لیست کاربران با موفقیت دریافت شد" : "کاربری یافت نشد",
                Data = users
            });
        }

        // GET: api/User/GetMyProfile
        [Authorize]
        [HttpGet("GetMyProfile")]
        public async Task<IActionResult> GetMyProfileAsync()
        {
            var profile = await _userService.GetMyProfileAsync();

            return Ok(new ApiResponse<ProfileResponseDto>
            {
                IsSuccess = true,
                Message = profile.Message,
                Data = profile
            });
        }
        #region Current User Role
        [Authorize]
        [HttpGet("GetRole")]
        public IActionResult GetCurrentUserRole()
        {
            var result = _userService.GetCurrentUserRole();

            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "اطلاعات نقش کاربر با موفقیت دریافت شد.",
                Data = result
            });
        }
        #endregion



        // PUT: api/User/UpdateProfile
        [Authorize] // فقط کاربر لاگین‌شده (نه مهمان)
        [HttpPut("UpdateProfile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto userDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiResponse { IsSuccess = false, Message = "داده‌های ورودی معتبر نیست." });

            var result = await _userService.UpdateProfileAsync(userDto);

            return Ok(new ApiResponse<UserDto>
            {
                IsSuccess = true,
                Message = "اطلاعات پروفایل با موفقیت بروزرسانی شد.",
                Data = result
            });
        }

        // POST: api/User/UploadProfileImage
        [Authorize] // فقط کاربر لاگین‌شده
        [HttpPost("UploadProfileImage")]
        public async Task<IActionResult> UploadProfileImage([FromForm] ChangeProfilePhotoDto dto)
        {
            if (dto?.File == null || dto.File.Length == 0)
                return BadRequest(new ApiResponse { IsSuccess = false, Message = "فایل عکس الزامی است." });

            var newImageUrl = await _userService.ChangeProfilePhotoAsync(dto);

            return Ok(new ApiResponse<string>
            {
                IsSuccess = true,
                Message = "عکس پروفایل با موفقیت تغییر کرد.",
                Data = newImageUrl
            });
        }
    }
}