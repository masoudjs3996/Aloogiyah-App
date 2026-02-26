using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace AlooGiyah_Application.Services.UserFolder;

public class AuthService : IAuthService
{
    #region Constructor
    private readonly IGenericRepository<User> _genericRepositoryUser;
    private readonly IGenericRepository<Role> _genericRepositoryRole;
    private readonly IGenericRepository<Wallet> _genericRepositoryWallet;
    private readonly IUserQuery _userQuery;
    private readonly IConfiguration _config;
    private readonly ICartService _cartService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuthRepository _authRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IMapper _mapper;
    private readonly IEmail _email;


    public AuthService(
        IGenericRepository<User> genericRepositoryUser,
        IGenericRepository<Role> genericRepositoryRole,
        IGenericRepository<Wallet> genericRepositoryWallet,
        IUserQuery userQuery,
        IConfiguration config,
        ICartService cartService,
        IUnitOfWork unitOfWork,
        IAuthRepository authRepository,
        ICurrentUserService currentUserService,
        IMapper mapper,
        IEmail email)
    {
        _genericRepositoryUser = genericRepositoryUser ?? throw new ArgumentNullException(nameof(genericRepositoryUser));
        _genericRepositoryRole = genericRepositoryRole ?? throw new ArgumentNullException(nameof(genericRepositoryRole));
        _genericRepositoryWallet = genericRepositoryWallet ?? throw new ArgumentNullException(nameof(genericRepositoryWallet));
        _userQuery = userQuery;
        _config = config ?? throw new ArgumentNullException(nameof(config));
        _cartService = cartService  ?? throw new ArgumentNullException(nameof(config));
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _authRepository = authRepository ?? throw new ArgumentNullException(nameof(authRepository));
        _currentUserService = currentUserService;
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _email = email ?? throw new ArgumentNullException(nameof(email));
    }
    #endregion


    #region ساخت اکسس توکن
    public string GenerateAccessToken(User user)
    {
        if (user == null)
            throw new ArgumentNullException(nameof(user));

        var key = _config["Jwt:Key"] ?? throw new InvalidOperationException("کلید JWT تنظیم نشده است.");
        var issuer = _config["Jwt:Issuer"] ?? throw new InvalidOperationException("Issuer تنظیم نشده است.");
        var audience = _config["Jwt:Audience"] ?? throw new InvalidOperationException("Audience تنظیم نشده است.");

        var tokenHandler = new JwtSecurityTokenHandler();
        var keyBytes = Encoding.UTF8.GetBytes(key);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim("Code", user.Code),
                new Claim(ClaimTypes.Role, user.Role.Name.ToString()),
                new Claim("RoleCode", user.Role.Code.ToString())
            }),
            Expires = DateTime.UtcNow.AddHours(2),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256Signature),
            Issuer = issuer,
            Audience = audience
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
    #endregion

    #region ساخت رفرش توکن
    public RefreshToken GenerateRefreshToken()
    {
        return new RefreshToken
        {
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            Expires = DateTime.UtcNow.AddDays(7)
        };
    }
    #endregion

    #region ساخت توکن مهمان
    public string GenerateGuestToken()
    {
        var keyStr = _config["Jwt:Key"] ?? throw new InvalidOperationException("کلید JWT تنظیم نشده است.");
        var issuer = _config["Jwt:Issuer"] ?? throw new InvalidOperationException("Issuer تنظیم نشده است.");
        var audience = _config["Jwt:Audience"] ?? throw new InvalidOperationException("Audience تنظیم نشده است.");
        var cartId = Guid.NewGuid().ToString();

        var tokenHandler = new JwtSecurityTokenHandler();
        var keyBytes = Encoding.UTF8.GetBytes(keyStr);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
               new Claim("cartId", cartId),
               new Claim(ClaimTypes.Role, "Guest"),
               new Claim("RoleCode", "47C2D51E0F"),
               new Claim("IsGuest", "true")
            }),
            Expires = DateTime.UtcNow.AddDays(30),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256Signature),
            Issuer = issuer,
            Audience = audience
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
    #endregion

    #region با استفاده از رفرش توکن به اکسس توکن اعتبار می‌دهیم
    public async Task<(string newAccessToken, RefreshToken newRefreshToken)> RefreshAccessTokenAsync(string refreshToken)
    {
        if (string.IsNullOrEmpty(refreshToken))
            throw new ArgumentNullException(nameof(refreshToken));

        var existingToken = await _authRepository.GetByTokenAsync(refreshToken);

        if (existingToken == null || existingToken.IsUsed || existingToken.IsRevoked || existingToken.Expires < DateTime.UtcNow)
            throw new UnauthorizedAccessException("توکن معتبر نیست");

        // باطل کردن همه توکن‌های قبلی
        await _authRepository.RevokeAllTokensForUserAsync(existingToken.UserId);

        // دریافت کاربر
        var user = await _genericRepositoryUser.GetByIdAsync(existingToken.UserId);
        if (user == null)
            throw new Exception("کاربر پیدا نشد");

        // اینجا نقش را به صورت جداگانه لود می‌کنیم
        var role = await _genericRepositoryRole.GetByIdAsync(user.RoleId);
        if (role == null)
            throw new Exception("نقش کاربر پیدا نشد");

        user.Role = role; // ست کردن Role برای جلوگیری از null

        // ساخت توکن جدید
        var newAccessToken = GenerateAccessToken(user);
        var newRefreshToken = GenerateRefreshToken();
        newRefreshToken.UserId = user.UserId;

        await _authRepository.AddAsync(newRefreshToken);
        await _unitOfWork.SaveChangesAsync();

        return (newAccessToken, newRefreshToken);
    }
    #endregion

    #region ثبت نام اولیه کاربر
    public async Task<(string accessToken, RefreshToken refreshToken)> RegisterUserAsync(RegisterUserDto dto)
    {
        if (dto == null)
            throw new ArgumentNullException(nameof(dto));

        var existing = await _userQuery.ExistsByUsernameAsync(dto.UserName);
        if (existing)
            throw new BadRequestException(
        message: "نام کاربری قبلاً ثبت شده است.",
        errorCode: "USERNAME_ALREADY_EXISTS");

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var user = _mapper.Map<User>(dto);
            user.Password = BCrypt.Net.BCrypt.HashPassword(dto.Password, 12);

            var role = await _genericRepositoryRole.GetByIdAsync(1); // لود Role با Id = 1
            if (role == null)
                throw new BadRequestException("نقش پیش‌فرض با Id 1 پیدا نشد.");
            user.Role = role;

            await _genericRepositoryUser.AddAsync(user);
            await _unitOfWork.SaveChangesAsync(); // ذخیره کاربر برای تولید UserId

            // -------------------
            // ساخت توکن کاربر
            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken();
            refreshToken.UserId = user.UserId;

            // merge کارت مهمان با کاربر جدید
            if (_currentUserService.CartId != null) // یعنی توکن مهمان موجود است
            {
                var CartCode = Guid.Parse(_currentUserService.CartId);
                await _cartService.MergeGuestCartWithUserAsync(user.UserId, CartCode);

                _currentUserService.ClearGuestCartId();
            }

            var wallet = new Wallet { UserId = user.UserId };
            await _genericRepositoryWallet.AddAsync(wallet);
            await _authRepository.AddAsync(refreshToken);
            await _unitOfWork.SaveChangesAsync(); // ذخیره RefreshToken و Wallet

            await transaction.CommitAsync();
            return (accessToken, refreshToken);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }


    #endregion

    #region ساخت توکن با لاگین کردن
    public async Task<(string accessToken, RefreshToken refreshToken)> LoginUserAsync(LoginDto loginDto)
    {
        if (loginDto == null)
            throw new ArgumentNullException(nameof(loginDto));

        var user = await _userQuery.GetByUsernameAsync(loginDto.Username);
        if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.Password))
            throw new UnauthorizedAccessException("نام کاربری یا رمز عبور اشتباه است.");

        var accessToken = GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken();
        refreshToken.UserId = user.UserId;

        // merge کارت مهمان با کاربر
        if (_currentUserService.CartId != null)
        {
         var CartCode =    Guid.Parse(_currentUserService.CartId);
            await _cartService.MergeGuestCartWithUserAsync(user.UserId, CartCode);
            _currentUserService.ClearGuestCartId();
        }

        await _authRepository.AddAsync(refreshToken);
        await _unitOfWork.SaveChangesAsync();

        return (accessToken, refreshToken);
    }

    #endregion

    #region ویرایش یوزرنیم
    public async Task<bool> ChangeUsernameAsync(ChangeUsernameDto model)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        if (model == null)
            throw new ArgumentNullException(nameof(model));

        int userId = int.Parse(_currentUserService.UserId);

        var user = await _genericRepositoryUser.GetByIdAsync(userId);
        if (user == null || user.UserName != model.CurrentUsername)
            return false;

        if (!BCrypt.Net.BCrypt.Verify(model.Password, user.Password))
            return false;

        var existingUser = await _userQuery.GetByUsernameAsync(model.NewUsername);
        if (existingUser != null)
            throw new Exception("یوزرنیم جدید قبلاً گرفته شده است");

        user.UserName = model.NewUsername;
        await _genericRepositoryUser.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }
    #endregion

    #region ساخت کد برای احراز هویت
    private async Task<bool> GenerateAndSendCodeAsync(User user, string codeType, string subject, string bodyTemplate)
    {
        if (user == null)
            throw new ArgumentNullException(nameof(user));

        var code = new Random().Next(100000, 999999).ToString();

        if (codeType == "emailVerification")
        {
            user.EmailVerificationCode = code;
            user.VerificationCodeExpiration = DateTime.UtcNow.AddMinutes(10);
        }
        else if (codeType == "passwordReset")
        {
            user.PasswordResetCode = code;
            user.PasswordResetExpiration = DateTime.UtcNow.AddMinutes(15);
        }

        if (string.IsNullOrEmpty(user.Email))
            throw new InvalidOperationException("UserFolder email is required to send verification code.");

        await _genericRepositoryUser.UpdateAsync(user);
        await _email.SendEmailAsync(user.Email, subject, string.Format(bodyTemplate, code));
        await _unitOfWork.SaveChangesAsync();

        return true;
    }
    #endregion

    #region ویرایش پسورد
    public async Task<bool> ChangePasswordAsync(ChangePasswordDto model)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        if (model == null)
            throw new ArgumentNullException(nameof(model));

        int userId = int.Parse(_currentUserService.UserId);

        var user = await _genericRepositoryUser.GetByIdAsync(userId);
        if (user == null)
            return false;

        if (!BCrypt.Net.BCrypt.Verify(model.CurrentPassword, user.Password))
            return false;

        user.Password = BCrypt.Net.BCrypt.HashPassword(model.NewPassword, workFactor: 12);
        await _genericRepositoryUser.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }
    #endregion

    #region تایید کد برای ایمیل
    public async Task<bool> VerifyEmailAsync(VerifyEmailDto verifyEmail)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        if (verifyEmail == null)
            throw new ArgumentNullException(nameof(verifyEmail));

        int userId = int.Parse(_currentUserService.UserId);

        var user = await _genericRepositoryUser.GetByIdAsync(userId);
        if (user == null)
            return false;

        if (user.EmailVerificationCode != verifyEmail.Code || user.VerificationCodeExpiration < DateTime.UtcNow)
            return false;

        user.EmailVerificationCode = null;
        user.VerificationCodeExpiration = null;
        user.IsEmailConfirmed = true;

        await _genericRepositoryUser.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }
    #endregion

    #region ارسال کد برای تایید ایمیل
    public async Task<bool> SendEmailVerificationCodeAsync()
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        int userId = int.Parse(_currentUserService.UserId);

        var user = await _genericRepositoryUser.GetByIdAsync(userId);
        if (user == null || user.IsEmailConfirmed)
            return false;

        return await GenerateAndSendCodeAsync(user, "emailVerification", "کد تایید ایمیل", "کد تایید شما: {0}");
    }
    #endregion

    #region ارسال کد برای بازیابی رمز عبور
    public async Task<bool> SendPasswordResetCodeAsync(string email)
    {
        if (string.IsNullOrEmpty(email))
            throw new ArgumentNullException(nameof(email));

        var user = await _genericRepositoryUser.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
            return false;

        return await GenerateAndSendCodeAsync(user, "passwordReset", "بازیابی رمز عبور", "کد بازیابی رمز عبور شما: {0}");
    }
    #endregion

    #region بررسی کد و تغییر رمز عبور فراموش شده
    public async Task<bool> ResetPasswordAsync(ResetPasswordDto model)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        if (model == null)
            throw new ArgumentNullException(nameof(model));

        int userId = int.Parse(_currentUserService.UserId);

        var user = await _genericRepositoryUser.GetByIdAsync(userId);
        if (user == null)
            return false;

        if (user.PasswordResetCode != model.ResetCode || user.PasswordResetExpiration < DateTime.UtcNow)
            return false;

        user.Password = BCrypt.Net.BCrypt.HashPassword(model.NewPassword, workFactor: 12);
        user.PasswordResetCode = null;
        user.PasswordResetExpiration = null;

        await _genericRepositoryUser.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }
    #endregion


}