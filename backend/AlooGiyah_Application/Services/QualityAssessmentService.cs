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

    public QualityAssessmentService(IQualityAssessmentQuery readQuery,
        
        IGenericRepository<QualityAssessment> qualityAssessmentRepository,
        IGenericRepository<AgriculturalProduct> agriculturalProductRepository,
        IGenericRepository<User> userRepository,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _readQuery = readQuery;
        _qualityAssessmentRepository = qualityAssessmentRepository;
        _agriculturalProductRepository = agriculturalProductRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion


    private bool IsManager => _currentUserService.Roles.Any(x => x == "Manager" || x == "Admin");
    private int CurrentId()
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.IsGuest || !int.TryParse(_currentUserService.UserId, out var id))
            throw new UnauthorizedException("ابتدا وارد حساب کاربری شوید.");
        return id;
    }
    public async Task<QualityAssessmentDto> RequestAsync(QualityAssessmentRequestDto dto)
    {
        var applicantId = CurrentId();
        if (dto.Quantity <= 0 || dto.Quantity > 100000000 || string.IsNullOrWhiteSpace(dto.RequestDescription) || dto.RequestDescription.Length > 700)
            throw new BadRequestException("شرح درخواست و مقدار خرید را درست وارد کنید.");
        var productId = await _agriculturalProductRepository.GetIdByCodeAsync(dto.AgriculturalProductCode, p => p.AgriculturalProductId)
            ?? throw new NotFoundException("محصول یافت نشد.");
        var entity = new QualityAssessment
        {
            AgriculturalProductId = productId, ApplicantId = applicantId, ExpertId = null,
            QualityGrade = "PENDING", SuggestedPrice = null, AssessmentDate = null,
            QualityDescription = "درخواست بررسی " + dto.Quantity.ToString(System.Globalization.CultureInfo.InvariantCulture) + " کیلوگرم: " + dto.RequestDescription.Trim()
        };
        await _qualityAssessmentRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        var result = _mapper.Map<QualityAssessmentDto>(entity);
        result.AgriculturalProductCode = dto.AgriculturalProductCode;
        return result;
    }

    #region Create
    public async Task<QualityAssessmentDto> CreateAsync(QualityAssessmentCreateDto dto)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        int applicant = CurrentId();
        var expertId = await _userRepository.GetIdByCodeAsync(dto.ExpertCode, u => u.UserId)
            ?? throw new NotFoundException("کارشناس یافت نشد.");
        if (!IsManager && expertId != applicant) throw new ForbiddenException("ثبت گزارش برای کارشناس دیگر مجاز نیست.");
        if (!IsManager && !_currentUserService.Roles.Contains("Expert"))
            throw new ForbiddenException("ثبت گزارش کیفیت فقط برای کارشناس کیفیت مجاز است.");
        var expert = await _userRepository.GetAll().Include(x => x.Role).Include(x => x.AdditionalRoles).ThenInclude(x => x.Role)
            .SingleOrDefaultAsync(x => x.UserId == expertId);
        if (expert == null || !HasRole(expert, "Expert"))
            throw new ForbiddenException("کاربر انتخاب‌شده نقش کارشناس کیفیت ندارد.");
        if (dto.QualityGrade == "PENDING") throw new BadRequestException("برای ثبت درخواست از مسیر Request استفاده کنید.");

        // گرفتن محصول کشاورزی
        var productId = await _agriculturalProductRepository.GetIdByCodeAsync(dto.AgriculturalProductCode, p => p.AgriculturalProductId);
        if (productId == null)
            throw new NotFoundException($"محصول کشاورزی با کد {dto.AgriculturalProductCode} پیدا نشد");

        // اعتبارسنجی QualityGrade
        if (string.IsNullOrWhiteSpace(dto.QualityGrade) || dto.QualityGrade.Length > 50)
            throw new InvalidOperationException("درجه کیفیت نامعتبر است");

        var entity = _mapper.Map<QualityAssessment>(dto);
        entity.AgriculturalProductId = productId.Value;
        entity.ApplicantId = applicant;
        entity.ExpertId = expertId;
        entity.AssessmentDate = dto.AssessmentDate ?? DateTime.UtcNow;

        await _qualityAssessmentRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        var qualityAssessmentDto = _mapper.Map<QualityAssessmentDto>(entity);
        qualityAssessmentDto.AgriculturalProductCode = dto.AgriculturalProductCode;

        return qualityAssessmentDto;
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
        if (expertWithRole == null || !HasRole(expertWithRole, "Expert"))
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

        if (!IsManager && (entity.ApplicantId != actorId || entity.QualityGrade != "PENDING"))
            throw new ForbiddenException("حذف این ارزیابی مجاز نیست.");
        await _qualityAssessmentRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    #endregion

    private static bool HasRole(User user, string roleName) =>
        user.Role?.Name == roleName || user.AdditionalRoles.Any(x => x.Role?.Name == roleName);
}
