using AlooGiyah_Application.DTOs.File;
using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AlooGiyah_Application.Services.UserFolder;

public class UserService : IUserService
{
    #region Constructor
    private readonly IUnitOfWork _unitOfWork;
    private readonly IGenericRepository<User> _userRepository;
    private readonly IUserRepository _userRepositorySpecific;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileService _fileService;
    private readonly IHttpContextAccessor _httpContextAccessor;     // اضافه شد
    private readonly IConfiguration _config;                        // اضافه شد
    private readonly IMapper _mapper;
    private readonly IUserQuery _userQuery;


    public UserService(
        IUnitOfWork unitOfWork,
        IGenericRepository<User> userRepository,
        IUserRepository userRepositorySpecific,
        ICurrentUserService currentUserService,
        IFileService fileService,
        IMapper mapper,
        IHttpContextAccessor httpContextAccessor,      // تزریق شد
            IConfiguration config,                          // تزریق شد
            IUserQuery userQuery
        )
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _userRepositorySpecific = userRepositorySpecific ?? throw new ArgumentNullException(nameof(userRepositorySpecific));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _fileService = fileService ?? throw new ArgumentNullException(nameof(fileService));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _httpContextAccessor = httpContextAccessor;
        _config = config;
        _userQuery = userQuery;
    }
    #endregion


    #region Get By Username
    public async Task<RegisterUserDto> GetUserByUsername(string username)
    {
        if (string.IsNullOrEmpty(username))
            throw new ArgumentNullException(nameof(username));

        var user = await _userQuery.GetByUsernameAsync(username);
        if (user == null)
            throw new NotFoundException("کاربر پیدا نشد");

        return _mapper.Map<RegisterUserDto>(user);
    }
    #endregion

    #region Get By Code
    public async Task<UserDto> GetUserByCode(string code)
    {
        var user = await _userQuery.GetByCodeAsync(code);
        if (user == null) throw new NotFoundException("کاربر پیدا پیدا نشد");

        var dto = _mapper.Map<UserDto>(user);

        dto.ProfileImageUrl = await _fileService.GetPrimaryFileUrlAsync(EntityFile.Profile, code);

        return dto;
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<UserDto>> GetUserByFilterAsync(UserFilterDto filter)
    {
        var result = await _userQuery.GetPagedFilteredAsync(filter);

        // اضافه کردن ProfileImageUrl
        foreach (var item in result.Items)
        {
            item.ProfileImageUrl =
                await _fileService.GetPrimaryFileUrlAsync(
                    EntityFile.Profile,
                    item.Code);
        }

        return result;
    }
    #endregion

    #region Get My Profile
    public async Task<ProfileResponseDto> GetMyProfileAsync()
    {
        var authHeader = _httpContextAccessor.HttpContext!
            .Request.Headers["Authorization"].ToString();

        var token = authHeader["Bearer ".Length..].Trim();
        var principal = ValidateToken(token);

        var isGuestClaim = principal.FindFirst("IsGuest")?.Value;
        if (bool.TryParse(isGuestClaim, out bool isGuest) && isGuest)
        {
            var cartIdClaim = principal.FindFirst("cartId")?.Value;

            return new ProfileResponseDto
            {
                IsGuest = true,
                CartId = Guid.TryParse(cartIdClaim, out var cartId) ? cartId : null
            };
        }
        var userIdStr = _currentUserService.UserId;
        if (string.IsNullOrWhiteSpace(userIdStr))
            throw new UnauthorizedException("شناسه کاربر در توکن یافت نشد.");

        if (!int.TryParse(userIdStr, out int userId))
            throw new UnauthorizedException("شناسه کاربر نامعتبر است (parse به int نشد).");

        var userDto = await _userQuery.GetByIdAsync(userId, includeRole: true)
            ?? throw new NotFoundException("کاربر یافت نشد.");

        userDto.ProfileImageUrl = await _fileService.GetPrimaryFileUrlAsync(
            EntityFile.Profile,
            userDto.Code   // هنوز از Code برای فایل‌ها استفاده می‌کنی
        );

        return new ProfileResponseDto
        {
            IsGuest = false,
            User = userDto
        };
    }
    private ClaimsPrincipal ValidateToken(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var keyBytes = Encoding.UTF8.GetBytes(
            _config["Jwt:Key"] ?? throw new InvalidOperationException("کلید JWT موجود نیست.")
        );

        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = _config["Jwt:Issuer"],
            ValidAudience = _config["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ClockSkew = TimeSpan.Zero
        };

        return tokenHandler.ValidateToken(token, validationParameters, out _);
    }

    #endregion

    #region Get Current User Role
    public CurrentUserRoleDto GetCurrentUserRole()
    {


        var principal = _httpContextAccessor.HttpContext?.User
            ?? throw new UnauthorizedAccessException("کاربر احراز هویت نشده است.");

        var roleName = principal.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(roleName))
            throw new BadRequestException("توکن مشکل دارد");
        
        var roleCode = principal.FindFirst("RoleCode")?.Value;

        if (string.IsNullOrEmpty(roleCode))
            throw new BadRequestException("توکن مشکل دارد");




        return new CurrentUserRoleDto
        {
            RoleName = roleName,
            RoleCode = roleCode,
        };
    }
    #endregion

    #region Update
    public async Task<UserDto> UpdateProfileAsync(UpdateProfileDto userDto)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        var userId = int.Parse(_currentUserService.UserId);

        if (userDto == null)
            throw new ArgumentNullException(nameof(userDto));

        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            throw new NotFoundException("کاربر پیدا نشد");

        _mapper.Map(userDto, user);

        var result = await _userRepository.UpdateAsync(user);

        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<UserDto>(result);
    }
    #endregion

    #region Change Profile Photo
    public async Task<string?> ChangeProfilePhotoAsync(ChangeProfilePhotoDto dto)
    {
        // چک کردن ورودی
        if (dto == null || dto.File == null || dto.File.Length == 0)
            throw new BadRequestException("فایل انتخاب نشده یا خالی است");

        // اختیاری: فقط اجازه عکس بده (توصیه می‌کنم باز کنی)
        if (!dto.File.ContentType.StartsWith("image/"))
            throw new BadRequestException("فقط فایل‌های تصویری مجاز هستند (jpg, png, gif, webp و ...)");

        // گرفتن UserId از توکن (همیشه string هست)
        var userIdClaim = _currentUserService.UserId
                          ?? throw new UnauthorizedException("کاربر لاگین نیست یا توکن معتبر نیست");

        if (!int.TryParse(userIdClaim, out int userId))
            throw new UnauthorizedException("شناسه کاربر نامعتبر است");

        // گرفتن کاربر از دیتابیس با ریپازیتوری اختصاصی
        var user = await _userRepositorySpecific.GetByIdAsync(userId)
                   ?? throw new NotFoundException("کاربر پیدا نشد");

        // اگر هنوز Code نداشت (خیلی نادر ولی ممکنه موقع ثبت‌نام اولیه null باشه
        if (string.IsNullOrEmpty(user.Code))
            throw new BadRequestException("کد کاربر تولید نشده است. ابتدا پروفایل را ذخیره کنید");

        var uploadDto = new FileUploadDto
        {
            File = dto.File,
            EntityCode = user.Code,
            EntityFile = EntityFile.Profile,
            FileTypeCode = "CD5A1A3870",
        };

        // آپلود فایل
        var uploadedFile = await _fileService.UploadFileAsync(uploadDto);

        // حذف عکس قبلی (اگر وجود داشت)
        await _fileService.RemovePrimaryFileAsync(EntityFile.Profile, user.Code);

        // ست کردن عکس جدید به عنوان عکس اصلی
        await _fileService.AttachFileAsPrimaryAsync(uploadedFile.FileCode, EntityFile.Profile, user.Code);
        // یا اگر اسم فیلد FileCode نیست و Code هست:
        // await _fileService.AttachFileAsPrimaryAsync(uploadedFile.Code, EntityFile.Profile, user.Code);

        // آپدیت زمان ویرایش کاربر
        user.UpdatedAt = DateTimeOffset.UtcNow;

        // ذخیره تغییرات (فایل جدید + زمان آپدیت کاربر)
        await _unitOfWork.SaveChangesAsync();

        // برگردوندن URL عکس جدید (اگر نداشت null برمی‌گردونه — عالی برای فرانت)
        return await _fileService.GetPrimaryFileUrlAsync(EntityFile.Profile, user.Code);
    }
    #endregion


}