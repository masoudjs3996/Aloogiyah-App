using AlooGiyah_Application.DTOs.QualityAssessment;
using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Application.Interfaces.UserFolder;
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
    #region Constractor
    private readonly IGenericRepository<QualityAssessment> _qualityAssessmentRepository;
    private readonly IGenericRepository<AgriculturalProduct> _agriculturalProductRepository;
    private readonly IGenericRepository<User> _userRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public QualityAssessmentService(
        IGenericRepository<QualityAssessment> qualityAssessmentRepository,
        IGenericRepository<AgriculturalProduct> agriculturalProductRepository,
        IGenericRepository<User> userRepository,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
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
        Expression<Func<QualityAssessment, bool>> predicate = qa => !qa.IsDeleted;

        if (!string.IsNullOrEmpty(filter.AgriculturalProductCode))
            predicate = predicate.And(qa => qa.AgriculturalProduct.Code == filter.AgriculturalProductCode);

        if (!string.IsNullOrEmpty(filter.ExpertCode))
            predicate = predicate.And(qa => qa.Expert.Code == filter.ExpertCode);

        if (!string.IsNullOrEmpty(filter.QualityGrade))
            predicate = predicate.And(qa => qa.QualityGrade == filter.QualityGrade);

        if (filter.MinSuggestedPrice.HasValue)
            predicate = predicate.And(qa => qa.SuggestedPrice >= filter.MinSuggestedPrice.Value);

        if (filter.MaxSuggestedPrice.HasValue)
            predicate = predicate.And(qa => qa.SuggestedPrice <= filter.MaxSuggestedPrice.Value);

        if (filter.StartAssessmentDate.HasValue)
            predicate = predicate.And(qa => qa.AssessmentDate >= filter.StartAssessmentDate.Value);

        if (filter.EndAssessmentDate.HasValue)
            predicate = predicate.And(qa => qa.AssessmentDate <= filter.EndAssessmentDate.Value);

        return await _qualityAssessmentRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: qa => new QualityAssessmentDto
            {
                Code = qa.Code,
                AgriculturalProductCode = qa.AgriculturalProduct.Code,
                ExpertCode = qa.Expert.Code,
                QualityDescription = qa.QualityDescription,
                QualityGrade = qa.QualityGrade,
                SuggestedPrice = qa.SuggestedPrice,
                AssessmentDate = qa.AssessmentDate,
                CreatedAt = qa.CreatedAt
            },
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: qa => qa.AssessmentDate ?? qa.CreatedAt
        );
    }
    #endregion

    #region Get By Code
    public async Task<QualityAssessmentDto?> GetByCodeAsync(string code)
    {
        var entity = await _qualityAssessmentRepository.GetByCodeAsync(code);
        if (entity == null)
            return null;

        var qualityAssessmentDto = _mapper.Map<QualityAssessmentDto>(entity);
        qualityAssessmentDto.AgriculturalProductCode = await _agriculturalProductRepository.GetCodeByIdAsync(entity.AgriculturalProductId) ?? string.Empty;
        if (entity.ExpertId.HasValue)
        {
            qualityAssessmentDto.ExpertCode =
                await _userRepository.GetCodeByIdAsync(entity.ExpertId.Value);
        }
        else
        {
            qualityAssessmentDto.ExpertCode = null;
        }

        return qualityAssessmentDto;
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