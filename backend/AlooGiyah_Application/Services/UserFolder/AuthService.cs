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
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

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
    private readonly IGenericRepository<PhoneOtpChallenge> _phoneOtpRepository;
    private readonly IHostEnvironment _environment;
    private readonly IPhoneCodeSender _phoneCodeSender;


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
        IEmail email,
        IGenericRepository<PhoneOtpChallenge> phoneOtpRepository,
        IHostEnvironment environment, IPhoneCodeSender phoneCodeSender)
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
        _phoneOtpRepository = phoneOtpRepository ?? throw new ArgumentNullException(nameof(phoneOtpRepository));
        _environment = environment ?? throw new ArgumentNullException(nameof(environment));
        _phoneCodeSender = phoneCodeSender;
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

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim("Code", user.Code),
            new Claim(ClaimTypes.Role, user.Role.Name),
            new Claim("RoleCode", user.Role.Code),
            new Claim("TokenVersion", user.TokenVersion.ToString(System.Globalization.CultureInfo.InvariantCulture))
        };
        foreach (var assignment in user.AdditionalRoles ?? [])
        {
            if (assignment.Role == null || assignment.Role.Name == user.Role.Name) continue;
            claims.Add(new Claim(ClaimTypes.Role, assignment.Role.Name));
            claims.Add(new Claim("RoleCode", assignment.Role.Code));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_config.GetValue<int>("Jwt:ExpireMinutes", 120)),
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

        await using var transaction = await _unitOfWork.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

        var existingToken = await _authRepository.GetByTokenAsync(refreshToken);

        if (existingToken == null || existingToken.IsUsed || existingToken.IsRevoked || existingToken.Expires <= DateTime.UtcNow)
            throw new UnauthorizedException("توکن معتبر نیست");

        // باطل کردن همه توکن‌های قبلی
        await _authRepository.RevokeAllTokensForUserAsync(existingToken.UserId);

        // دریافت کاربر
        var user = await _genericRepositoryUser.GetAll().Include(x => x.Role)
            .Include(x => x.AdditionalRoles).ThenInclude(x => x.Role)
            .SingleOrDefaultAsync(x => x.UserId == existingToken.UserId);
        if (user == null)
            throw new Exception("کاربر پیدا نشد");

        // اینجا نقش را به صورت جداگانه لود می‌کنیم
        if (user.Role == null)
            throw new Exception("نقش کاربر پیدا نشد");

        // ساخت توکن جدید
        var newAccessToken = GenerateAccessToken(user);
        var newRefreshToken = GenerateRefreshToken();
        newRefreshToken.UserId = user.UserId;

        await _authRepository.AddAsync(newRefreshToken);
        await _unitOfWork.SaveChangesAsync();
        await transaction.CommitAsync();
        return (newAccessToken, newRefreshToken);
    }
    #endregion

    #region ثبت نام اولیه کاربر
    public async Task<(string accessToken, RefreshToken refreshToken)> RegisterUserAsync(RegisterUserDto dto)
    {
        if (dto == null)
            throw new ArgumentNullException(nameof(dto));

        if (User.IsGeneratedPhoneUsername(dto.UserName))
            throw new BadRequestException("نام کاربری دیگری انتخاب کنید.");
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

            var role = await GetDefaultUserRoleAsync();
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
        if (user == null && System.Text.RegularExpressions.Regex.IsMatch(loginDto.Username, @"^\+?[0-9۰-۹٠-٩]{10,14}$") &&
            NormalizeIranianPhoneNumber(loginDto.Username) is { } phone)
        {
            user = await _genericRepositoryUser.GetAll()
                .Include(item => item.Role)
                .Include(item => item.AdditionalRoles).ThenInclude(assignment => assignment.Role)
                .FirstOrDefaultAsync(item => item.PhoneNumber == phone && item.IsPhoneConfirmed);
        }
        if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.Password))
            throw new UnauthorizedException("نام کاربری یا رمز عبور اشتباه است.");

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

    public async Task<PhoneCodeResponseDto> RequestPhoneCodeAsync(RequestPhoneCodeDto dto)
    {
        var testMode = _environment.IsDevelopment()
            && _config.GetValue<bool>("Auth:ExposeOtpCodeInDevelopment")
            && !_phoneCodeSender.IsConfigured;
        if (!_config.GetValue<bool>("Auth:PhoneOtpEnabled") || (!_phoneCodeSender.IsConfigured && !testMode))
            throw new BadRequestException("ارسال کد پیامکی تا زمان اتصال پنل پیامک فعال نیست.");

        var phoneNumber = NormalizeIranianPhoneNumber(dto.PhoneNumber);
        if (phoneNumber == null)
            throw new BadRequestException("شماره موبایل معتبر نیست.");

        var purpose = dto.Purpose.Trim();
        if (purpose is not ("Login" or "Register" or "PasswordSetup" or "ProfileVerification"))
            throw new BadRequestException("نوع درخواست معتبر نیست.");
        if (purpose == "Register" && (string.IsNullOrWhiteSpace(dto.FName) || string.IsNullOrWhiteSpace(dto.LName)))
            throw new BadRequestException("نام و نام خانوادگی الزامی است.");
        int? requestedBy = null;
        User? existingUser;
        if (purpose == "ProfileVerification")
        {
            if (_currentUserService.IsGuest || !int.TryParse(_currentUserService.UserId, out var userId))
                throw new UnauthorizedException("ابتدا وارد حساب شوید.");
            existingUser = await _genericRepositoryUser.GetByIdAsync(userId);
            if (existingUser == null || existingUser.IsDeleted || NormalizeIranianPhoneNumber(existingUser.PhoneNumber) != phoneNumber)
                throw new BadRequestException("ابتدا شمارهٔ موبایل را در حساب ذخیره کنید.");
            if (existingUser.IsPhoneConfirmed)
                throw new BadRequestException("این شماره قبلاً تأیید شده است.");
            requestedBy = userId;
        }
        else
        {
            existingUser = await _genericRepositoryUser.GetAll()
                .FirstOrDefaultAsync(user => user.PhoneNumber == phoneNumber &&
                    (purpose != "Login" || user.IsPhoneConfirmed));
        }
        if (purpose == "PasswordSetup" && (existingUser == null || _currentUserService.IsGuest ||
            !int.TryParse(_currentUserService.UserId, out var actorId) || existingUser.UserId != actorId ||
            !User.IsGeneratedPhoneUsername(existingUser.UserName)))
            throw new ForbiddenException("فعال‌سازی رمز فقط برای شمارهٔ همین حساب پیامکی مجاز است.");
        if (purpose == "Login" && existingUser == null)
            throw new BadRequestException("برای این شماره حساب تأییدشده‌ای پیدا نشد. اگر حساب دارید، با نام کاربری وارد شوید و شماره را تأیید کنید.");
        if (purpose == "Register" && existingUser != null)
            throw new BadRequestException("این شماره قبلاً ثبت‌نام کرده است. از گزینه ورود استفاده کنید.");

        var now = DateTimeOffset.UtcNow;
        var resendDelay = TimeSpan.FromMinutes(purpose == "Login" ? 3 : 1);
        var previousChallenge = await _phoneOtpRepository.GetAll()
            .Where(challenge => challenge.PhoneNumber == phoneNumber && challenge.Purpose == purpose)
            .OrderByDescending(challenge => challenge.CreatedAt)
            .FirstOrDefaultAsync();
        if (previousChallenge != null && previousChallenge.CreatedAt + resendDelay > now)
            throw new BadRequestException(purpose == "Login"
                ? "برای دریافت دوباره کد ورود، سه دقیقه از آخرین ارسال صبر کنید."
                : "برای دریافت کد جدید، یک دقیقه صبر کنید.");
        if (previousChallenge != null)
            await _phoneOtpRepository.DeleteAsync(previousChallenge);

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var challenge = new PhoneOtpChallenge
        {
            PhoneNumber = phoneNumber,
            Purpose = purpose,
            RequestedByUserId = requestedBy,
            CodeHash = BCrypt.Net.BCrypt.HashPassword(code),
            FName = dto.FName?.Trim(),
            LName = dto.LName?.Trim(),
            CreatedAt = now,
            ExpiresAt = purpose == "Login" ? now + resendDelay : now.AddMinutes(5)
        };
        await _phoneOtpRepository.AddAsync(challenge);
        await _unitOfWork.SaveChangesAsync();

        if (!testMode)
        {
            try
            {
                await _phoneCodeSender.SendAsync(phoneNumber,
                    (purpose != "Register" ? existingUser?.FName : dto.FName)?.Trim() ?? "کاربر",
                    (purpose != "Register" ? existingUser?.LName : dto.LName)?.Trim() ?? "عزیز",
                    code);
            }
            catch
            {
                await _phoneOtpRepository.DeleteAsync(challenge);
                await _unitOfWork.SaveChangesAsync();
                throw;
            }
        }

        return new PhoneCodeResponseDto
        {
            ChallengeCode = challenge.Code,
            ExpiresAt = challenge.ExpiresAt,
            ExpiresInSeconds = Math.Max(0, (int)Math.Ceiling((challenge.ExpiresAt - DateTimeOffset.UtcNow).TotalSeconds)),
            TestCode = testMode
                ? code
                : null
        };
    }

    public async Task<(string accessToken, RefreshToken refreshToken, bool isNewUser)> VerifyPhoneCodeAsync(VerifyPhoneCodeDto dto)
    {
        var challenge = await _phoneOtpRepository.FirstOrDefaultAsync(item => item.Code == dto.ChallengeCode);
        if (challenge == null || challenge.Purpose is not ("Login" or "Register"))
            throw new BadRequestException("درخواست کد معتبر نیست؛ دوباره کد بگیرید.");
        if (challenge.ExpiresAt <= DateTimeOffset.UtcNow)
            throw new BadRequestException("مهلت کد تمام شده است؛ دوباره کد بگیرید.");
        if (challenge.FailedAttempts >= 5)
            throw new BadRequestException("تعداد تلاش‌ها بیش از حد مجاز است؛ دوباره کد بگیرید.");
        if (!BCrypt.Net.BCrypt.Verify(dto.Code, challenge.CodeHash))
        {
            challenge.FailedAttempts++;
            await _phoneOtpRepository.UpdateAsync(challenge);
            await _unitOfWork.SaveChangesAsync();
            throw new BadRequestException("کد واردشده درست نیست.");
        }

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            User user;
            var isNewUser = challenge.Purpose == "Register";
            if (isNewUser)
            {
                if (await _genericRepositoryUser.GetAll().AnyAsync(item => item.PhoneNumber == challenge.PhoneNumber))
                    throw new BadRequestException("این شماره قبلاً ثبت‌نام کرده است. از گزینه ورود استفاده کنید.");

                var role = await GetDefaultUserRoleAsync();
                user = new User
                {
                    UserName = $"phone_{challenge.PhoneNumber}",
                    Password = BCrypt.Net.BCrypt.HashPassword(Convert.ToBase64String(RandomNumberGenerator.GetBytes(48)), 12),
                    PhoneNumber = challenge.PhoneNumber,
                    IsPhoneConfirmed = true,
                    FName = string.IsNullOrWhiteSpace(challenge.FName) ? "کاربر" : challenge.FName,
                    LName = challenge.LName,
                    RoleId = role.RoleId,
                    Role = role
                };
                await _genericRepositoryUser.AddAsync(user);
                await _unitOfWork.SaveChangesAsync();
                await _genericRepositoryWallet.AddAsync(new Wallet { UserId = user.UserId });
            }
            else
            {
                user = await _genericRepositoryUser.GetAll()
                    .Include(item => item.Role)
                    .Include(item => item.AdditionalRoles).ThenInclude(assignment => assignment.Role)
                    .FirstOrDefaultAsync(item => item.PhoneNumber == challenge.PhoneNumber && item.IsPhoneConfirmed)
                    ?? throw new BadRequestException("شمارهٔ تأییدشده برای ورود پیدا نشد.");
            }

            await _phoneOtpRepository.DeleteAsync(challenge);
            var tokens = await CreateTokensAsync(user);
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();
            return (tokens.accessToken, tokens.refreshToken, isNewUser);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task VerifyProfilePhoneAsync(VerifyPhoneCodeDto dto)
    {
        if (_currentUserService.IsGuest || !int.TryParse(_currentUserService.UserId, out var userId))
            throw new UnauthorizedException("ابتدا وارد حساب شوید.");

        await using var transaction = await _unitOfWork.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var user = await _genericRepositoryUser.GetByIdAsync(userId);
        var phoneNumber = NormalizeIranianPhoneNumber(user?.PhoneNumber);
        var challenge = await _phoneOtpRepository.FirstOrDefaultAsync(item => item.Code == dto.ChallengeCode &&
            item.RequestedByUserId == userId && item.PhoneNumber == phoneNumber && item.Purpose == "ProfileVerification");
        if (user == null || user.IsDeleted || phoneNumber == null || challenge == null ||
            challenge.ExpiresAt <= DateTimeOffset.UtcNow || challenge.FailedAttempts >= 5)
            throw new BadRequestException("کد معتبر نیست یا مهلت آن تمام شده است. دوباره کد بگیرید.");
        if (!BCrypt.Net.BCrypt.Verify(dto.Code, challenge.CodeHash))
        {
            challenge.FailedAttempts++;
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();
            throw new BadRequestException("کد واردشده درست نیست.");
        }

        if (await _genericRepositoryUser.GetAll().AnyAsync(item => item.UserId != userId &&
            item.PhoneNumber == phoneNumber && item.IsPhoneConfirmed))
            throw new BadRequestException("این شماره برای حساب دیگری تأیید شده است.");

        user.PhoneNumber = phoneNumber;
        user.IsPhoneConfirmed = true;
        await _phoneOtpRepository.DeleteAsync(challenge);
        await _unitOfWork.SaveChangesAsync();
        await transaction.CommitAsync();
    }

    public async Task SetPhoneCredentialsAsync(SetPhoneCredentialsDto dto)
    {
        if (_currentUserService.IsGuest || !int.TryParse(_currentUserService.UserId, out var userId))
            throw new UnauthorizedException("ابتدا وارد حساب شوید.");
        if (User.IsGeneratedPhoneUsername(dto.Username))
            throw new BadRequestException("نام کاربری دیگری انتخاب کنید.");

        await using var transaction = await _unitOfWork.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var user = await _genericRepositoryUser.GetByIdAsync(userId);
        if (user == null || !User.IsGeneratedPhoneUsername(user.UserName))
            throw new BadRequestException("ورود با رمز برای این حساب قابل فعال‌سازی نیست.");
        var challenge = await _phoneOtpRepository.FirstOrDefaultAsync(item => item.Code == dto.ChallengeCode &&
            item.PhoneNumber == user.PhoneNumber && item.Purpose == "PasswordSetup");
        if (challenge == null || challenge.ExpiresAt <= DateTimeOffset.UtcNow || challenge.FailedAttempts >= 5)
            throw new BadRequestException("کد معتبر نیست یا مهلت آن تمام شده است. دوباره کد بگیرید.");
        if (!BCrypt.Net.BCrypt.Verify(dto.Code, challenge.CodeHash))
        {
            challenge.FailedAttempts++;
            await _phoneOtpRepository.UpdateAsync(challenge);
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();
            throw new BadRequestException("کد واردشده درست نیست.");
        }
        if (await _genericRepositoryUser.GetAll().AnyAsync(item => item.UserName == dto.Username))
            throw new BadRequestException("این نام کاربری قبلاً استفاده شده است.");

        user.UserName = dto.Username;
        user.IsPhoneConfirmed = true;
        user.Password = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 12);
        user.PasswordResetCode = null;
        user.PasswordResetExpiration = null;
        user.TokenVersion++;
        await _authRepository.RevokeAllTokensForUserAsync(userId);
        await _genericRepositoryUser.UpdateAsync(user);
        await _phoneOtpRepository.DeleteAsync(challenge);
        await _unitOfWork.SaveChangesAsync();
        await transaction.CommitAsync();
    }

    private async Task<Role> GetDefaultUserRoleAsync() =>
        await _genericRepositoryRole.GetAll().SingleOrDefaultAsync(role => role.Name == "User")
        ?? throw new BadRequestException("نقش پایه کاربر در سامانه پیکربندی نشده است.");

    private async Task<(string accessToken, RefreshToken refreshToken)> CreateTokensAsync(User user)
    {
        if (user.Role == null)
            user = await _genericRepositoryUser.GetAll()
                .Include(item => item.Role)
                .Include(item => item.AdditionalRoles).ThenInclude(assignment => assignment.Role)
                .FirstAsync(item => item.UserId == user.UserId);

        var accessToken = GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken();
        refreshToken.UserId = user.UserId;
        if (_currentUserService.CartId != null && Guid.TryParse(_currentUserService.CartId, out var cartCode))
        {
            await _cartService.MergeGuestCartWithUserAsync(user.UserId, cartCode);
            _currentUserService.ClearGuestCartId();
        }
        await _authRepository.AddAsync(refreshToken);
        return (accessToken, refreshToken);
    }

    private static string? NormalizeIranianPhoneNumber(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;
        var value = input.Trim()
            .Replace('۰', '0').Replace('۱', '1').Replace('۲', '2').Replace('۳', '3').Replace('۴', '4')
            .Replace('۵', '5').Replace('۶', '6').Replace('۷', '7').Replace('۸', '8').Replace('۹', '9')
            .Replace('٠', '0').Replace('١', '1').Replace('٢', '2').Replace('٣', '3').Replace('٤', '4')
            .Replace('٥', '5').Replace('٦', '6').Replace('٧', '7').Replace('٨', '8').Replace('٩', '9');
        value = new string(value.Where(char.IsDigit).ToArray());
        if (value.StartsWith("0098")) value = value[4..];
        else if (value.StartsWith("98") && value.Length == 12) value = value[2..];
        if (value.Length == 10 && value.StartsWith('9')) value = "0" + value;
        return value.Length == 11 && value.StartsWith("09") ? value : null;
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

        if (User.IsGeneratedPhoneUsername(model.NewUsername))
            throw new BadRequestException("نام کاربری دیگری انتخاب کنید.");

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
    private const int EmailVerificationMinutes = 10;

    private async Task<bool> GenerateAndSendCodeAsync(User user, string codeType, string subject, Func<string, string> formatBody)
    {
        if (user == null)
            throw new ArgumentNullException(nameof(user));

        if (string.IsNullOrWhiteSpace(user.Email))
            throw new BadRequestException("ابتدا ایمیل حساب کاربری را ثبت کنید.");
        if (new[] { "From", "SmtpServer", "Username", "Password" }.Any(name =>
                string.IsNullOrWhiteSpace(_config["EmailSettings:" + name])))
            throw new BadRequestException("ارسال ایمیل هنوز پیکربندی نشده است؛ با پشتیبانی تماس بگیرید.");

        var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        var codeHash = Convert.ToBase64String(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(code)));

        if (codeType == "emailVerification")
        {
            var email = user.Email;
            var expiration = DateTimeOffset.UtcNow.AddMinutes(EmailVerificationMinutes);
            await _email.SendEmailAsync(email, subject, formatBody(code));
            var saved = await _genericRepositoryUser.GetAll()
                .Where(item => item.UserId == user.UserId && item.Email == email && !item.IsEmailConfirmed)
                .ExecuteUpdateAsync(set => set
                    .SetProperty(item => item.EmailVerificationCode, codeHash)
                    .SetProperty(item => item.VerificationCodeExpiration, expiration));
            return saved == 1;
        }
        if (codeType == "passwordReset")
        {
            user.PasswordResetCode = codeHash;
            user.PasswordResetExpiration = DateTime.UtcNow.AddMinutes(15);
        }

        if (string.IsNullOrEmpty(user.Email))
            throw new InvalidOperationException("UserFolder email is required to send verification code.");

        await _genericRepositoryUser.UpdateAsync(user);
        await _email.SendEmailAsync(user.Email, subject, formatBody(code));
        await _unitOfWork.SaveChangesAsync();

        return true;
    }

    private static string EmailVerificationBody(string code) => $$"""
        <!doctype html>
        <html lang="fa" dir="rtl">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>تأیید ایمیل الو گیاه</title>
        </head>
        <body style="margin:0;background-color:#f1f6f2;color:#1f342a;font-family:Tahoma,Arial,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f6f2;">
            <tr><td align="center" style="padding:32px 16px;">
              <table role="presentation" dir="rtl" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#ffffff;border:1px solid #dce9df;border-radius:16px;">
                <tr><td style="padding:28px 24px;text-align:right;">
                  <p style="margin:0 0 14px;color:#14613e;font-size:15px;font-weight:bold;">الو گیاه</p>
                  <h1 style="margin:0 0 12px;font-size:23px;line-height:1.6;">تأیید ایمیل حساب کاربری</h1>
                  <p style="margin:0 0 20px;font-size:14px;line-height:2;">برای تأیید نشانی ایمیل، این کد را در بخش حساب کاربری وارد کنید.</p>
                  <p dir="ltr" style="margin:0 0 16px;padding:16px 8px;text-align:center;border-radius:12px;background-color:#e8f5ec;color:#125735;font-family:monospace;font-size:30px;font-weight:bold;letter-spacing:5px;">{{code}}</p>
                  <p style="margin:0 0 16px;color:#385b49;font-size:13px;line-height:2;">کد تا {{EmailVerificationMinutes}} دقیقه اعتبار دارد. آن را با کسی به اشتراک نگذارید.</p>
                  <p style="margin:0;padding-top:16px;border-top:1px solid #e5eee7;color:#53675b;font-size:12px;line-height:2;">اگر این درخواست را شما ثبت نکرده‌اید، می‌توانید این ایمیل را نادیده بگیرید.</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;
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
        user.TokenVersion++;
        await _authRepository.RevokeAllTokensForUserAsync(user.UserId);
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

        var verificationHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(verifyEmail.Code)));
        var now = DateTimeOffset.UtcNow;
        var verified = await _genericRepositoryUser.GetAll()
            .Where(user => user.UserId == userId && user.Email != null &&
                user.EmailVerificationCode == verificationHash && user.VerificationCodeExpiration > now)
            .ExecuteUpdateAsync(set => set
                .SetProperty(user => user.EmailVerificationCode, (string?)null)
                .SetProperty(user => user.VerificationCodeExpiration, (DateTimeOffset?)null)
                .SetProperty(user => user.IsEmailConfirmed, true));

        return verified == 1;
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

        return await GenerateAndSendCodeAsync(user, "emailVerification", "کد تأیید ایمیل الو گیاه", EmailVerificationBody);
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

        return await GenerateAndSendCodeAsync(user, "passwordReset", "بازیابی رمز عبور", code => $"کد بازیابی رمز عبور شما: {code}");
    }
    #endregion

    #region بررسی کد و تغییر رمز عبور فراموش شده
    public async Task<bool> ResetPasswordAsync(ResetPasswordDto model)
    {
        if (model == null)
            throw new ArgumentNullException(nameof(model));
        var user = await _genericRepositoryUser.FirstOrDefaultAsync(u => u.Email == model.Email && !u.IsDeleted);
        if (user == null)
            return false;

        var resetHash = Convert.ToBase64String(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(model.ResetCode)));
        if (string.IsNullOrEmpty(user.PasswordResetCode) || user.PasswordResetExpiration == null ||
            user.PasswordResetCode != resetHash || user.PasswordResetExpiration <= DateTime.UtcNow)
            return false;

        user.Password = BCrypt.Net.BCrypt.HashPassword(model.NewPassword, workFactor: 12);
        user.TokenVersion++;
        await _authRepository.RevokeAllTokensForUserAsync(user.UserId);
        user.PasswordResetCode = null;
        user.PasswordResetExpiration = null;

        await _genericRepositoryUser.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return true;
    }
    #endregion


}
