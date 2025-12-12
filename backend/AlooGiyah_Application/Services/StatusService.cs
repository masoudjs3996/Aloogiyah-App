using AlooGiyah_Application.DTOs.Status;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AutoMapper;
using System.Linq.Expressions;

namespace AlooGiyah_Application.Services;

public class StatusService : IStatusService
{
    #region Constructor
    private readonly IGenericRepository<Status> _statusRepository;
    private readonly IGenericRepository<Auction> _auctionRepository;
    private readonly IGenericRepository<AgriculturalOrder> _agriculturalOrderRepository;
    private readonly IGenericRepository<Order> _orderRepository;
    private readonly IGenericRepository<ServiceRequest> _serviceRequestRepository;

    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public StatusService(
        IGenericRepository<Status> statusRepository,
        IGenericRepository<Auction> auctionRepository,
        IGenericRepository<AgriculturalOrder> agriculturalOrderRepository,
        IGenericRepository<Order> orderRepository,
        IGenericRepository<ServiceRequest> serviceRequestRepository,

        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _statusRepository = statusRepository;
        _auctionRepository = auctionRepository;
        _agriculturalOrderRepository = agriculturalOrderRepository;
        _orderRepository = orderRepository;
        _serviceRequestRepository = serviceRequestRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion


    #region Create
    public async Task<StatusDto> CreateAsync(StatusCreateDto dto)
    {
        // اعتبارسنجی نام
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new InvalidOperationException("نام وضعیت نمی‌تواند خالی باشد");

        // چک کردن وجود وضعیت مشابه
        var exists = await _statusRepository.ExistsAsync(s => s.Name == dto.Name && s.EntityStatus == dto.EntityStatus && !s.IsDeleted);
        if (exists)
            throw new InvalidOperationException($"وضعیت با نام '{dto.Name}' و نوع '{dto.EntityStatus}' قبلاً وجود دارد");

        var entity = _mapper.Map<Status>(dto);
        await _statusRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<StatusDto>(entity);
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(StatusUpdateDto dto)
    {
        var entity = await _statusRepository.GetByCodeAsync(dto.Code);
        if (entity == null)
            return false;

        // اعتبارسنجی نام
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new InvalidOperationException("نام وضعیت نمی‌تواند خالی باشد");

        // چک کردن وجود وضعیت مشابه
        var exists = await _statusRepository.ExistsAsync(s => s.Name == dto.Name && s.EntityStatus == dto.EntityStatus && s.Code != dto.Code && !s.IsDeleted);
        if (exists)
            throw new InvalidOperationException($"وضعیت با نام '{dto.Name}' و نوع '{dto.EntityStatus}' قبلاً وجود دارد");

        _mapper.Map(dto, entity);
        await _statusRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var entity = await _statusRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        // چک کردن استفاده از وضعیت در موجودیت‌های مرتبط
        var isUsed = await IsStatusInUse(entity.StatusId, entity.EntityStatus);
        if (isUsed)
            throw new InvalidOperationException("این وضعیت در حال استفاده است و نمی‌تواند حذف شود");

        await _statusRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    private async Task<bool> IsStatusInUse(int statusId, EntityStatus entityType)
    {
        switch (entityType)
        {
            case EntityStatus.AuctionStatus:
                return await _auctionRepository.ExistsAsync(a => a.StatusId == statusId && !a.IsDeleted);
            case EntityStatus.AgriculturalOrderStatus:
                return await _agriculturalOrderRepository.ExistsAsync(o => o.StatusId == statusId && !o.IsDeleted);
            case EntityStatus.OrderStatus:
                return await _orderRepository.ExistsAsync(o => o.StatusId == statusId && !o.IsDeleted);
            case EntityStatus.ServiceRequestStatus:
                return await _serviceRequestRepository.ExistsAsync(sr => sr.StatusId == statusId && !sr.IsDeleted);
            default:
                return false;
        }
    }
    #endregion

    #region Get By Code
    public async Task<StatusDto?> GetByCodeAsync(string code)
    {
        var entity = await _statusRepository.GetByCodeAsync(code);
        if (entity == null)
            return null;

        return _mapper.Map<StatusDto>(entity);
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<StatusDto>> GetByFilterAsync(StatusFilterDto filter)
    {
        Expression<Func<Status, bool>> predicate = s => !s.IsDeleted;

        if (!string.IsNullOrEmpty(filter.Name))
            predicate = predicate.And(s => s.Name.Contains(filter.Name));

        if (filter.EntityStatus.HasValue)
            predicate = predicate.And(s => s.EntityStatus == filter.EntityStatus.Value);

        return await _statusRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: s => new StatusDto
            {
                Code = s.Code,
                Name = s.Name,
                Description = s.Description,
                EntityStatus = s.EntityStatus,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            },
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: s => s.CreatedAt
        );
    }
    #endregion
}