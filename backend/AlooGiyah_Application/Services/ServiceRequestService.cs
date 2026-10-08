using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.ServiceRequest;
using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using AlooGiyah_Domain.Enums;

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
    private readonly IGenericRepository<Address> _addressRepository;
    private readonly IPriceCalculatorService _priceCalculatorService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ServiceRequestService(IServiceRequestQuery readQuery,
        
        IGenericRepository<ServiceRequest> serviceRequestRepository,
        IGenericRepository<User> userRepository,
        ICurrentUserService currentUserService,
        IGenericRepository<Status> statusRepository,
        IGenericRepository<Discount> discountRepository,
        IGenericRepository<Address> addressRepository,
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
        _addressRepository = addressRepository;
        _priceCalculatorService = priceCalculatorService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion

    #region Create
    public async Task<ServiceRequestDto> CreateAsync(ServiceRequestCreateDto dto)
    {
        var userId = CurrentUserId();
        var address = await _addressRepository.GetAll().SingleOrDefaultAsync(a => a.Code == dto.AddressCode && a.UserId == userId && !a.IsDeleted)
            ?? throw new BadRequestException("یک نشانی معتبر از نشانی‌های ذخیره‌شده انتخاب کنید.");

        var serviceStatuses = await _statusRepository.GetAll().Where(s => s.EntityStatus == EntityStatus.ServiceRequestStatus && !s.IsDeleted).ToListAsync();
        var status = serviceStatuses.SingleOrDefault(s => s.Code == dto.StatusCode);
        status ??= serviceStatuses.FirstOrDefault(s => s.Code.Equals("Pending", StringComparison.OrdinalIgnoreCase) ||
            s.Name.Contains("انتظار", StringComparison.OrdinalIgnoreCase) || s.Name.Contains("pending", StringComparison.OrdinalIgnoreCase));
        if (status == null)
            throw new BadRequestException("وضعیت «در انتظار بررسی» برای درخواست خدمات در سامانه تعریف نشده است.");
        int? statusId = status.StatusId;

        // Service discounts need their own eligibility/usage policy before they can be accepted.
        if (!string.IsNullOrWhiteSpace(dto.DiscountCode))
            throw new BadRequestException("تخفیف برای درخواست خدمات هنوز فعال نیست.");

        int? discountId = null;

        // مپ کردن DTO به انتیتی
        var entity = _mapper.Map<ServiceRequest>(dto);
        entity.UserId = userId;
        entity.AddressId = address.AddressId;
        entity.StatusId = statusId ?? throw new InvalidOperationException("A service request status is required.");
        entity.DiscountId = discountId;
        // DiscountAmount comes from the client DTO and must never be trusted as a price input.
        entity.DiscountAmount = 0;
        entity.Description = (dto.Description ?? string.Empty).Trim();
        entity.servicedate = dto.ServiceDate?.ToUniversalTime();
        ServiceRequestValidation.Validate(entity);

        entity.Price = _priceCalculatorService.CalculateServiceRequest(entity);

        await _serviceRequestRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        return await _readQuery.GetByCodeAsync(entity.Code)
            ?? throw new InvalidOperationException("The saved service request could not be read.");
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
        var actorId = CurrentUserId();
        var isOwner = entity.UserId == actorId;
        var isAssignedProvider = entity.ProviderId == actorId && _currentUserService.Roles.Contains("Provider");
        if (!IsManager && !isOwner && !isAssignedProvider)
            throw new ForbiddenException("ویرایش این درخواست برای شما مجاز نیست.");
        if (isAssignedProvider && !IsManager && (dto.Description != null || dto.Price.HasValue || dto.DiscountAmount.HasValue || dto.DiscountCode != null || dto.ProviderCode != null ||
                                  dto.NumberOfVases.HasValue || dto.GardenArea.HasValue || dto.GreenhouseArea.HasValue))
            throw new ForbiddenException("ارائه‌دهنده فقط می‌تواند وضعیت و زمان خدمت تخصیص‌یافته را به‌روزرسانی کند.");
        if (isOwner && !IsManager && (entity.ProviderId.HasValue || dto.StatusCode != null || dto.ProviderCode != null ||
                                      dto.Price.HasValue || dto.DiscountAmount.HasValue || dto.DiscountCode != null))
            throw new ForbiddenException("پس از تخصیص ارائه‌دهنده، تغییر این درخواست برای ثبت‌کننده مجاز نیست.");
        if (dto.AddressCode != null && (!isOwner || entity.ProviderId.HasValue))
            throw new ForbiddenException("تغییر نشانی پس از تخصیص ارائه‌دهنده مجاز نیست.");
        if (dto.AddressCode != null)
        {
            var addressId = await _addressRepository.GetAll().Where(a => a.Code == dto.AddressCode && a.UserId == actorId && !a.IsDeleted)
                .Select(a => (int?)a.AddressId).SingleOrDefaultAsync();
            entity.AddressId = addressId ?? throw new BadRequestException("نشانی انتخاب‌شده معتبر نیست.");
        }

        if (dto.StatusCode != null)
        {
            if (!IsManager && !isAssignedProvider) throw new ForbiddenException("تغییر وضعیت فقط برای مدیریت یا ارائه‌دهنده تخصیص‌یافته مجاز است.");
            var status = await _statusRepository.GetAll().SingleOrDefaultAsync(s => s.Code == dto.StatusCode && s.EntityStatus == EntityStatus.ServiceRequestStatus)
                ?? throw new NotFoundException("وضعیت معتبر درخواست خدمت پیدا نشد.");
            entity.StatusId = status.StatusId;
        }
        if (dto.ServiceDate.HasValue) entity.servicedate = dto.ServiceDate.Value.ToUniversalTime();
        if ((!isAssignedProvider || IsManager) && dto.Description != null) entity.Description = dto.Description.Trim();
        if ((!isAssignedProvider || IsManager) && dto.NumberOfVases.HasValue) entity.NumberOfVases = dto.NumberOfVases;
        if ((!isAssignedProvider || IsManager) && dto.GardenArea.HasValue) entity.GardenArea = dto.GardenArea;
        if ((!isAssignedProvider || IsManager) && dto.GreenhouseArea.HasValue) entity.GreenhouseArea = dto.GreenhouseArea;

        if (dto.Price.HasValue || dto.DiscountAmount.HasValue || dto.DiscountCode != null)
            throw new BadRequestException("قیمت خدمت در سرور محاسبه می‌شود و تخفیف خدمات هنوز فعال نیست.");
        ServiceRequestValidation.Validate(entity);
        if (dto.NumberOfVases.HasValue || dto.GardenArea.HasValue || dto.GreenhouseArea.HasValue)
        {
            entity.DiscountAmount = 0;
            entity.Price = _priceCalculatorService.CalculateServiceRequest(entity);
        }
        if (!string.IsNullOrWhiteSpace(dto.ProviderCode) && IsManager)
            await AssignProviderAsync(entity, dto.ProviderCode);

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
        CurrentUserId();
        if (!IsManager) throw new ForbiddenException("تخصیص ارائه‌دهنده فقط برای مدیریت مجاز است.");

        // لود درخواست با روابط
        var entity = await _serviceRequestRepository.GetByCodeAsync(dto.Code);
        if (entity == null)
            throw new NotFoundException("درخواست خدمت پیدا نشد.");

        await AssignProviderAsync(entity, dto.ProviderCode);
        var provider = await _userRepository.GetByCodeAsync(dto.ProviderCode)
            ?? throw new NotFoundException("ارائه‌دهنده پیدا نشد.");
        var user = _mapper.Map<UserDto>(provider);
        await _serviceRequestRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return user;
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var actorId = CurrentUserId();
        var entity = await _serviceRequestRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        if (!IsManager && (entity.UserId != actorId || entity.ProviderId.HasValue))
            throw new ForbiddenException("حذف این درخواست مجاز نیست.");

        await _serviceRequestRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private async Task AssignProviderAsync(ServiceRequest entity, string providerCode)
    {
        var provider = await _userRepository.GetAll().Include(x => x.Role).Include(x => x.AdditionalRoles).ThenInclude(x => x.Role)
            .SingleOrDefaultAsync(x => x.Code == providerCode)
            ?? throw new NotFoundException($"ارائه‌دهنده با کد {providerCode} پیدا نشد");
        if (!HasRole(provider, "Provider")) throw new ForbiddenException("کاربر انتخاب‌شده نقش Provider ندارد.");
        entity.ProviderId = provider.UserId;
    }

    private int CurrentUserId()
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.IsGuest || !int.TryParse(_currentUserService.UserId, out var id))
            throw new AlooGiyah_Shared.Exceptions.UnauthorizedException("ابتدا وارد حساب کاربری شوید.");
        return id;
    }

    private bool IsManager => _currentUserService.Roles.Contains("Manager") || _currentUserService.Roles.Contains("Admin");
    private static bool HasRole(User user, string roleName) =>
        user.Role?.Name == roleName || user.AdditionalRoles.Any(x => x.Role?.Name == roleName);
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
