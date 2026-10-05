using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.ServiceRequest;
using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System.Linq.Expressions;

namespace AlooGiyah_Application.Services;

public class ServiceRequestService : IServiceRequestService
{
    private readonly IServiceRequestQuery _readQuery;

    #region Constructor
    private readonly IGenericRepository<ServiceRequest> _serviceRequestRepository;
    private readonly IGenericRepository<User> _userRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IGenericRepository<Status> _statusRepository;
    private readonly IGenericRepository<Discount> _discountRepository;
    private readonly IPriceCalculatorService _priceCalculatorService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ServiceRequestService(IServiceRequestQuery readQuery,
        
        IGenericRepository<ServiceRequest> serviceRequestRepository,
        IGenericRepository<User> userRepository,
        ICurrentUserService currentUserService,
        IGenericRepository<Status> statusRepository,
        IGenericRepository<Discount> discountRepository,
        IPriceCalculatorService priceCalculatorService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _readQuery = readQuery;
        _serviceRequestRepository = serviceRequestRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
        _statusRepository = statusRepository;
        _discountRepository = discountRepository;
        _priceCalculatorService = priceCalculatorService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion

    #region Create
    public async Task<ServiceRequestDto> CreateAsync(ServiceRequestCreateDto dto)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        if (dto.DiscountAmount < 0)
            throw new InvalidOperationException("مقدار تخفیف نمی‌تواند منفی باشد");

        var userId = int.Parse(_currentUserService.UserId);


        // گرفتن StatusId از StatusCode (پیش‌فرض اگر خالی باشد)
        int? statusId = null;
        if (!string.IsNullOrEmpty(dto.StatusCode))
        {
            statusId = await _statusRepository.GetIdByCodeAsync(dto.StatusCode, s => s.StatusId);
            if (statusId == null)
                throw new NotFoundException($"وضعیت با کد {dto.StatusCode} پیدا نشد");
        }

        // گرفتن DiscountId از DiscountCode (در صورت وجود)
        int? discountId = null;
        if (!string.IsNullOrEmpty(dto.DiscountCode))
        {
            var discount = await _discountRepository.GetByCodeAsync(dto.DiscountCode);
            if (discount == null)
                throw new NotFoundException($"تخفیف با کد {dto.DiscountCode} پیدا نشد");
            discountId = discount.DiscountId;
        }

        // مپ کردن DTO به انتیتی
        var entity = _mapper.Map<ServiceRequest>(dto);
        entity.UserId = userId;
        entity.StatusId = statusId ?? throw new InvalidOperationException("A service request status is required.");
        entity.DiscountId = discountId;


        entity.Price = _priceCalculatorService.CalculateServiceRequest(entity);

        await _serviceRequestRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        // مپ کردن انتیتی به DTO و تنظیم کدهای مربوطه
        var requestDto = _mapper.Map<ServiceRequestDto>(entity);
        requestDto.StatusCode = await _statusRepository.GetCodeByIdAsync(entity.StatusId) ?? string.Empty;
        requestDto.DiscountCode = dto.DiscountCode;

        return requestDto;
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(ServiceRequestUpdateDto dto)
    {
        if (dto == null)
            throw new ArgumentNullException(nameof(dto));

        // لود درخواست با روابط
        var entity = await _serviceRequestRepository.GetByCodeAsync(dto.Code);
        if (entity == null)
            return false;

        if (dto.DiscountAmount < 0)
            throw new InvalidOperationException("مقدار تخفیف نمی‌تواند منفی باشد");

        // به‌روزرسانی ProviderId
        if (!string.IsNullOrEmpty(dto.ProviderCode))
        {
            var providerId = await _userRepository.GetIdByCodeAsync(dto.ProviderCode, u => u.UserId);
            if (providerId == null)
                throw new NotFoundException($"ارائه‌دهنده با کد {dto.ProviderCode} پیدا نشد");
            entity.ProviderId = providerId;
        }

        // به‌روزرسانی StatusId
        if (!string.IsNullOrEmpty(dto.StatusCode))
        {
            var statusId = await _statusRepository.GetIdByCodeAsync(dto.StatusCode, s => s.StatusId);
            if (statusId == null)
                throw new NotFoundException($"وضعیت با کد {dto.StatusCode} پیدا نشد");
            entity.StatusId = statusId ?? throw new InvalidOperationException("A service request status is required.");
        }

        // به‌روزرسانی DiscountId
        if (!string.IsNullOrEmpty(dto.DiscountCode))
        {
            var discount = await _discountRepository.GetByCodeAsync(dto.DiscountCode);
            if (discount == null)
                throw new NotFoundException($"تخفیف با کد {dto.DiscountCode} پیدا نشد");
            entity.DiscountId = discount.DiscountId;
            entity.DiscountAmount = dto.DiscountAmount ?? 0;
        }

        entity.NumberOfVases = dto.NumberOfVases;
        entity.GardenArea = dto.GardenArea;
        entity.GreenhouseArea = dto.GreenhouseArea;

        entity.Price = _priceCalculatorService.CalculateServiceRequest(entity);

        // مپ کردن بقیه فیلدها
        _mapper.Map(dto, entity);

        await _serviceRequestRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
 
        return true;
    }
    #endregion

    #region Add Provider
    public async Task<UserDto> AddProviderAsync(AddProviderDto dto)
    {
        if (dto == null)
            throw new ArgumentNullException(nameof(dto));

        // لود درخواست با روابط
        var entity = await _serviceRequestRepository.GetByCodeAsync(dto.Code);
        if (entity == null)
            throw new NullReferenceException();

        var provider = await _userRepository.GetByCodeAsync(dto.ProviderCode);
        if (provider == null)
            throw new NotFoundException($"ارائه‌دهنده با کد {dto.ProviderCode} پیدا نشد");
        entity.ProviderId = provider.UserId;

        var user = _mapper.Map<UserDto>(provider);

        return user;
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var entity = await _serviceRequestRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        await _serviceRequestRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Get By Code
    public async Task<ServiceRequestDto?> GetByCodeAsync(string code)
    {
        return await _readQuery.GetByCodeAsync(code);
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<ServiceRequestDto>> GetPagedAsync(ServiceRequestFilterDto filter)
    {
        return await _readQuery.GetPagedAsync(filter);
    }

  
    #endregion
}