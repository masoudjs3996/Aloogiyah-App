using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.QualityAssessment;
using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using AlooGiyah_Domain.Enums;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Data;
using Microsoft.AspNetCore.Http;

namespace AlooGiyah_Application.Services;

public class QualityAssessmentService : IQualityAssessmentService
{
    private readonly IQualityAssessmentQuery _readQuery;

    #region Constractor
    private readonly IGenericRepository<QualityAssessment> _qualityAssessmentRepository;
    private readonly IGenericRepository<AgriculturalProduct> _agriculturalProductRepository;
    private readonly IGenericRepository<User> _userRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IGenericRepository<Wallet> _wallets;
    private readonly IGenericRepository<WalletTransaction> _walletTransactions;
    private readonly IGenericRepository<Discount> _discounts;
    private readonly IGenericRepository<AgriculturalOrder> _orders;
    private readonly IGenericRepository<QualityAssessmentTariff> _tariffs;
    private readonly IFileStorageService _fileStorage;

    public QualityAssessmentService(IQualityAssessmentQuery readQuery,
        
        IGenericRepository<QualityAssessment> qualityAssessmentRepository,
        IGenericRepository<AgriculturalProduct> agriculturalProductRepository,
        IGenericRepository<User> userRepository,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IGenericRepository<Wallet> wallets, IGenericRepository<WalletTransaction> walletTransactions,
        IGenericRepository<Discount> discounts, IGenericRepository<AgriculturalOrder> orders,
        IGenericRepository<QualityAssessmentTariff> tariffs, IFileStorageService fileStorage)
    {
        _readQuery = readQuery;
        _qualityAssessmentRepository = qualityAssessmentRepository;
        _agriculturalProductRepository = agriculturalProductRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _mapper = mapper; _wallets = wallets; _walletTransactions = walletTransactions; _discounts = discounts; _orders = orders; _tariffs = tariffs; _fileStorage = fileStorage;
    }
    #endregion


    private bool IsManager => _currentUserService.Roles.Any(x => x == "Manager" || x == "Admin");
    private int CurrentId()
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.IsGuest || !int.TryParse(_currentUserService.UserId, out var id))
            throw new UnauthorizedException("ابتدا وارد حساب کاربری شوید.");
        return id;
    }
    public async Task<string> GetExpertForApplicantAsync(string code)
    {
        var actorId = CurrentId();
        var request = await _qualityAssessmentRepository.GetAll().AsNoTracking()
            .SingleOrDefaultAsync(x => x.Code == code)
            ?? throw new NotFoundException("درخواست کارشناسی یافت نشد.");
        if (request.ApplicantId != actorId)
            throw new ForbiddenException("گفت‌وگو با کارشناس این گزارش فقط برای درخواست‌دهنده مجاز است.");
        if (!request.ExpertId.HasValue || request.ExpertId == actorId)
            throw new BadRequestException("کارشناس قابل گفت‌وگو برای این درخواست تعیین نشده است.");
        var expert = await _userRepository.GetAll().AsNoTracking().Include(x => x.Role).Include(x => x.AdditionalRoles).ThenInclude(x => x.Role)
            .SingleOrDefaultAsync(x => x.UserId == request.ExpertId.Value);
        if (expert == null || (!HasRole(expert, "Expert") && !HasRole(expert, "Manager")))
            throw new BadRequestException("کارشناس این درخواست در دسترس نیست.");
        return expert.Code;
    }

    public async Task<decimal> GetFeeAsync() => await _tariffs.GetAll().OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.QualityAssessmentTariffId).Select(x => x.Fee).FirstOrDefaultAsync();
    public async Task SetFeeAsync(decimal fee)
    {
        CurrentId();
        if (!IsManager) throw new ForbiddenException("تغییر تعرفه فقط برای مدیر مجاز است.");
        if (fee <= 0 || fee > 1000000000m) throw new BadRequestException("تعرفه معتبر نیست.");
        await _tariffs.AddAsync(new QualityAssessmentTariff { Fee = fee });
        await _unitOfWork.SaveChangesAsync();
    }
    private async Task<(QualityAssessmentQuoteDto Quote, Discount? Discount)> QuoteInternalAsync(QualityAssessmentQuoteInput dto, int id)
    {
        var fee = await GetFeeAsync();
        if (fee <= 0) throw new BadRequestException("تعرفه کارشناسی هنوز تنظیم نشده است.");
        var product = await _agriculturalProductRepository.GetAll().Include(x => x.Categories).Include(x => x.Status)
            .SingleOrDefaultAsync(x => x.Code == dto.AgriculturalProductCode)
            ?? throw new NotFoundException("محصول یافت نشد.");
        if (product.Status.Code != "251BC4A57D") throw new BadRequestException("محصول برای کارشناسی در دسترس نیست.");
        Discount? discount = null;
        decimal discountAmount = 0;
        if (!string.IsNullOrWhiteSpace(dto.DiscountCode))
        {
            discount = await _discounts.GetAll().Include(x => x.Users).Include(x => x.agriculturalProducts).Include(x => x.Categories)
                .SingleOrDefaultAsync(x => x.Code == dto.DiscountCode.Trim());
            var now = DateTimeOffset.UtcNow;
            if (discount == null || !discount.ForQualityAssessment || !discount.IsActive || discount.StartDate > now || discount.EndDate < now ||
                discount.MaxUsage.HasValue && discount.UsageCount >= discount.MaxUsage ||
                discount.Users.Count > 0 && !discount.Users.Any(x => x.UserId == id) ||
                discount.FarmId.HasValue && discount.FarmId != product.FarmId ||
                discount.agriculturalProducts.Count > 0 && !discount.agriculturalProducts.Any(x => x.AgriculturalProductId == product.AgriculturalProductId) ||
                discount.Categories.Count > 0 && !product.Categories.Any(x => discount.Categories.Any(c => c.CategoryId == x.CategoryId)) ||
                discount.Value < 0 || discount.MaxDiscountAmount < 0 || discount.DiscountType == DiscountType.Percentage && discount.Value > 100)
                throw new BadRequestException("کد تخفیف کیفیت‌سنجی معتبر نیست.");
            var amount = discount.DiscountType switch { DiscountType.Percentage => fee * discount.Value / 100m, DiscountType.Fixed => discount.Value, _ => throw new BadRequestException("نوع تخفیف معتبر نیست.") };
            discountAmount = decimal.Round(Math.Min(fee, Math.Min(amount, discount.MaxDiscountAmount ?? decimal.MaxValue)), 2);
        }
        var wallet = await _wallets.GetAll().AsNoTracking().SingleOrDefaultAsync(x => x.UserId == id);
        return (new QualityAssessmentQuoteDto { Fee = fee, DiscountAmount = discountAmount, PayableAmount = fee - discountAmount,
            AvailableBalance = wallet == null ? 0 : wallet.Balance - wallet.HeldAmount }, discount);
    }
    public async Task<QualityAssessmentQuoteDto> QuoteAsync(QualityAssessmentQuoteInput dto) => (await QuoteInternalAsync(dto, CurrentId())).Quote;
    public async Task<QualityAssessmentDto> RequestAsync(QualityAssessmentRequestDto dto)
    {
        var applicantId = CurrentId();
        if (dto.Quantity <= 0 || dto.Quantity > 100000000 || string.IsNullOrWhiteSpace(dto.RequestDescription) || dto.RequestDescription.Length > 700 ||
            string.IsNullOrWhiteSpace(dto.IdempotencyKey) || dto.IdempotencyKey.Length is < 8 or > 100)
            throw new BadRequestException("شرح درخواست، مقدار و شناسه درخواست معتبر نیست.");
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { dto.AgriculturalProductCode, dto.AgriculturalOrderCode, dto.Quantity, dto.RequestDescription, dto.DiscountCode, dto.ExpectedAmount }))));
        await using var tx = await _unitOfWork.BeginTransactionAsync(IsolationLevel.Serializable);
        var existing = await _qualityAssessmentRepository.GetAll().SingleOrDefaultAsync(x => x.ApplicantId == applicantId && x.IdempotencyKey == dto.IdempotencyKey);
        if (existing != null) {
            if (existing.RequestHash != hash) throw new ConflictException("شناسه درخواست برای اطلاعات دیگری استفاده شده است.");
            await tx.CommitAsync();
            return await _readQuery.GetByCodeAsync(existing.Code) ?? throw new NotFoundException("درخواست یافت نشد.");
        }
        var product = await _agriculturalProductRepository.GetAll().Include(x => x.Farm).SingleOrDefaultAsync(x => x.Code == dto.AgriculturalProductCode)
            ?? throw new NotFoundException("محصول یافت نشد.");
        AgriculturalOrder? order = null;
        if (!string.IsNullOrWhiteSpace(dto.AgriculturalOrderCode)) {
            order = await _orders.GetAll().Include(x => x.Farm).Include(x => x.AgriculturalOrderItems).SingleOrDefaultAsync(x => x.Code == dto.AgriculturalOrderCode)
                ?? throw new NotFoundException("سفارش یافت نشد.");
            if (order.BuyerId != applicantId && order.Farm?.OwnerId != applicantId) throw new ForbiddenException("درخواست کارشناسی این سفارش مجاز نیست.");
            if (!order.AgriculturalOrderItems.Any(x => x.AgriculturalProductId == product.AgriculturalProductId)) throw new BadRequestException("محصول متعلق به این سفارش نیست.");
        }
        var (quote, discount) = await QuoteInternalAsync(new QualityAssessmentQuoteInput { AgriculturalProductCode = dto.AgriculturalProductCode, DiscountCode = dto.DiscountCode }, applicantId);
        if (dto.ExpectedAmount != quote.PayableAmount) throw new ConflictException("هزینه تغییر کرده است؛ مبلغ جدید را بررسی و دوباره تأیید کنید.");
        var entity = new QualityAssessment { AgriculturalProductId = product.AgriculturalProductId, AgriculturalOrderId = order?.AgriculturalOrderId,
            ApplicantId = applicantId, QualityGrade = "PENDING", RequestedQuantity = dto.Quantity, RequestDescription = dto.RequestDescription.Trim(),
            Fee = quote.Fee, DiscountAmount = quote.DiscountAmount, PaidAmount = quote.PayableAmount, PaidAt = DateTimeOffset.UtcNow,
            IdempotencyKey = dto.IdempotencyKey, RequestHash = hash };
        if (quote.PayableAmount > 0) {
            var wallet = await _wallets.GetAll().SingleOrDefaultAsync(x => x.UserId == applicantId) ?? throw new BadRequestException("کیف پول یافت نشد؛ ابتدا کیف پول را شارژ کنید.");
            if (wallet.Balance - wallet.HeldAmount < quote.PayableAmount) throw new BadRequestException("موجودی آزاد کیف پول کافی نیست.");
            wallet.Balance -= quote.PayableAmount;
            await _walletTransactions.AddAsync(new WalletTransaction { WalletId = wallet.WalletId, Amount = quote.PayableAmount,
                TransactionType = WalletTransactionType.Withdrawal, ReferenceId = "QUALITY_" + entity.Code, Description = "پرداخت کیفیت‌سنجی " + product.Name });
        }
        if (discount != null) discount.UsageCount++;
        await _qualityAssessmentRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        await tx.CommitAsync();
        return await _readQuery.GetByCodeAsync(entity.Code) ?? throw new NotFoundException("درخواست ثبت‌شده یافت نشد.");
    }
    public async Task<string> UploadReportAsync(string code, IFormFile file)
    {
        var id = CurrentId();
        var entity = await _qualityAssessmentRepository.GetByCodeAsync(code) ?? throw new NotFoundException("درخواست یافت نشد.");
        if (!IsManager && (entity.ExpertId != id || !_currentUserService.Roles.Contains("Expert"))) throw new ForbiddenException("فقط کارشناس تخصیص‌یافته می‌تواند فایل گزارش را بارگذاری کند.");
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (file.Length == 0 || file.Length > 15 * 1024 * 1024 || extension is not ".pdf" and not ".jpg" and not ".jpeg" and not ".png" and not ".webp")
            throw new BadRequestException("گزارش باید PDF یا تصویر و حداکثر ۱۵ مگابایت باشد.");
        var signature = new byte[12];
        await using (var stream = file.OpenReadStream()) {
            var count = await stream.ReadAsync(signature);
            var valid = extension switch {
                ".pdf" => count >= 5 && Encoding.ASCII.GetString(signature, 0, 5) == "%PDF-",
                ".jpg" or ".jpeg" => count >= 3 && signature[0] == 0xff && signature[1] == 0xd8 && signature[2] == 0xff,
                ".png" => count >= 8 && signature.AsSpan(0, 8).SequenceEqual(new byte[] {137,80,78,71,13,10,26,10}),
                ".webp" => count >= 12 && Encoding.ASCII.GetString(signature, 0, 4) == "RIFF" && Encoding.ASCII.GetString(signature, 8, 4) == "WEBP",
                _ => false
            };
            if (!valid) throw new BadRequestException("محتوای فایل گزارش با نوع انتخاب‌شده مطابقت ندارد.");
        }
        var url = await _fileStorage.SaveFileAsync(file, EntityFile.QualityAssessment, code, true);
        try { entity.ReportFileUrl = url; await _unitOfWork.SaveChangesAsync(); }
        catch { await _fileStorage.DeleteFileAsync(url); throw; }
        return url;
    }

    #region Create
    public Task<QualityAssessmentDto> CreateAsync(QualityAssessmentCreateDto dto)
    {
        throw new BadRequestException("گزارش باید روی درخواست ثبت‌شده و پرداخت‌شده تکمیل شود.");
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<QualityAssessmentDto>> GetByFilterAsync(QualityAssessmentFilterDto filter)
    {
        return await _readQuery.GetByFilterAsync(filter);
    }
    #endregion

    #region Get By Code
    public async Task<QualityAssessmentDto?> GetByCodeAsync(string code)
    {
        return await _readQuery.GetByCodeAsync(code);
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(QualityAssessmentUpdateDto dto)
    {
        var entity = await _qualityAssessmentRepository.GetByCodeAsync(dto.Code);
        if (entity == null)
            return false;

        var actorId = CurrentId();
        if (!IsManager && !_currentUserService.Roles.Contains("Expert")) throw new ForbiddenException("ثبت گزارش فقط برای کارشناس مجاز است.");
        if (!IsManager && entity.ExpertId != actorId) throw new ForbiddenException("فقط کارشناس تخصیص‌یافته مجاز به ثبت نتیجه است.");
        if (!IsManager && dto.ExpertCode != (await _userRepository.GetCodeByIdAsync(actorId)))
            throw new ForbiddenException("تغییر کارشناس مجاز نیست.");
        if (dto.QualityGrade == "PENDING") throw new BadRequestException("نتیجه کارشناسی معتبر نیست.");
        // گرفتن کارشناس
        var expertId = await _userRepository.GetIdByCodeAsync(dto.ExpertCode, u => u.UserId);
        if (expertId == null)
            throw new NotFoundException($"کارشناس با کد {dto.ExpertCode} پیدا نشد");
        var expert = await _userRepository.GetAll().Include(x => x.Role).Include(x => x.AdditionalRoles).ThenInclude(x => x.Role)
            .SingleOrDefaultAsync(x => x.UserId == expertId.Value);
        if (expert == null || !HasRole(expert, "Expert"))
            throw new ForbiddenException("کاربر انتخاب‌شده نقش کارشناس کیفیت ندارد.");

        // اعتبارسنجی QualityGrade
        if (string.IsNullOrWhiteSpace(dto.QualityGrade) || dto.QualityGrade.Length > 50)
            throw new InvalidOperationException("درجه کیفیت نامعتبر است");

        if (string.IsNullOrWhiteSpace(dto.QualityDescription) || dto.QualityDescription.Length > 1000 || dto.SuggestedPrice < 0)
            throw new BadRequestException("شرح نتیجه و قیمت پیشنهادی معتبر نیست.");
        if (dto.Report == null) throw new BadRequestException("فرم گزارش کارشناسی را تکمیل کنید.");
        entity.ReportJson = dto.Report.ToValidatedJson(dto.QualityGrade);
        entity.QualityDescription = dto.QualityDescription;
        entity.QualityGrade = dto.QualityGrade;
        entity.SuggestedPrice = dto.SuggestedPrice;
        entity.AssessmentDate = dto.AssessmentDate ?? DateTime.UtcNow;
        entity.ExpertId = expertId.Value;

        await _qualityAssessmentRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region AddExpert
    public async Task<UserDto> AddExpert(AddExpertDto dto)
    {
        CurrentId();
        if (!IsManager) throw new ForbiddenException("تخصیص کارشناس فقط برای مدیریت مجاز است.");
        var entity = await _qualityAssessmentRepository.GetByCodeAsync(dto.Code);

        if (entity == null)
            return null!;

        var expert = await _userRepository.GetByCodeAsync(dto.ExpertCode);
        if (expert == null)
            throw new NotFoundException($"کارشناس با کد {dto.ExpertCode} پیدا نشد");
        var expertWithRole = await _userRepository.GetAll().Include(x => x.Role).Include(x => x.AdditionalRoles).ThenInclude(x => x.Role)
            .SingleOrDefaultAsync(x => x.UserId == expert.UserId);
        if (expertWithRole == null || (!HasRole(expertWithRole, "Expert") && !HasRole(expertWithRole, "Manager")))
            throw new ForbiddenException("فقط کاربر دارای نقش Expert قابل تخصیص است.");

        entity.ExpertId = expert.UserId;

        var user = _mapper.Map<UserDto>(expert);

        await _qualityAssessmentRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return user;
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var actorId = CurrentId();
        var entity = await _qualityAssessmentRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        if (entity.PaidAt.HasValue) throw new ConflictException("درخواست پرداخت‌شده قابل حذف نیست؛ با پشتیبانی تماس بگیرید.");
        if (!IsManager && (entity.ApplicantId != actorId || entity.QualityGrade != "PENDING"))
            throw new ForbiddenException("حذف این ارزیابی مجاز نیست.");
        await _qualityAssessmentRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    #endregion

    private static bool HasRole(User user, string roleName) =>
        !user.IsDeleted && ((user.Role?.Name == roleName && !user.Role.IsDeleted) || user.AdditionalRoles.Any(x => !x.IsDeleted && x.Role?.Name == roleName && !x.Role.IsDeleted));
}
