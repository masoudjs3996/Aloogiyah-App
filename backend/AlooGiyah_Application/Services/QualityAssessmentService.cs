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


    #region Create
    public async Task<QualityAssessmentDto> CreateAsync(QualityAssessmentCreateDto dto)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        int applicant = int.Parse(_currentUserService.UserId);

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

        // گرفتن کارشناس
        var expertId = await _userRepository.GetIdByCodeAsync(dto.ExpertCode, u => u.UserId);
        if (expertId == null)
            throw new NotFoundException($"کارشناس با کد {dto.ExpertCode} پیدا نشد");

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
        var entity = await _qualityAssessmentRepository.GetByCodeAsync(dto.Code);

        if (entity == null)
            return null!;

        var expert = await _userRepository.GetByCodeAsync(dto.ExpertCode);
        if (expert == null)
            throw new NotFoundException($"کارشناس با کد {dto.ExpertCode} پیدا نشد");

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
        var entity = await _qualityAssessmentRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        await _qualityAssessmentRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    #endregion
}