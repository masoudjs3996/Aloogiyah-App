using AlooGiyah_Application.DTOs.Warehouse;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Application.Interfaces.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AutoMapper;
using System.Linq.Expressions;

namespace AlooGiyah_Application.Services;

public class WarehouseService : IWarehouseService
{
    #region Constructor
    private readonly IGenericRepository<Warehouse> _warehouseRepository;
    private readonly IGenericRepository<User> _userRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IGenericRepository<WarehouseInventory> _warehouseInventoryRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public WarehouseService(
        IGenericRepository<Warehouse> warehouseRepository,
        IGenericRepository<User> userRepository,
        ICurrentUserService currentUserService,
        IGenericRepository<WarehouseInventory> warehouseInventoryRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _warehouseRepository = warehouseRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
        _warehouseInventoryRepository = warehouseInventoryRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion


    #region Create
    public async Task<WarehouseDto> CreateAsync(WarehouseCreateDto dto)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        // اعتبارسنجی نام
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new InvalidOperationException("نام انبار نمی‌تواند خالی باشد");

        // اعتبارسنجی کشاورز
        var farmerId = int.Parse(_currentUserService.UserId);

        // چک کردن وجود انبار مشابه
        var exists = await _warehouseRepository.ExistsAsync(w => w.Name == dto.Name && w.FarmerId == farmerId && !w.IsDeleted);
        if (exists)
            throw new InvalidOperationException($"انبار با نام '{dto.Name}' برای این کشاورز قبلاً وجود دارد");

        var entity = _mapper.Map<Warehouse>(dto);
        entity.FarmerId = farmerId;

        await _warehouseRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        var warehouseDto = _mapper.Map<WarehouseDto>(entity);
        warehouseDto.FarmerCode = dto.FarmerCode;

        return warehouseDto;
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(WarehouseUpdateDto dto)
    {
        var entity = await _warehouseRepository.GetByCodeAsync(dto.Code);
        if (entity == null)
            return false;

        // اعتبارسنجی نام
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new InvalidOperationException("نام انبار نمی‌تواند خالی باشد");

        // چک کردن وجود انبار مشابه
        var exists = await _warehouseRepository.ExistsAsync(w => w.Name == dto.Name && w.Code != dto.Code && !w.IsDeleted);
        if (exists)
            throw new InvalidOperationException($"انبار با نام '{dto.Name}' برای این کشاورز قبلاً وجود دارد");

        _mapper.Map(dto, entity);

        await _warehouseRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var entity = await _warehouseRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        // چک کردن وجود موجودی در انبار
        var hasInventory = await _warehouseInventoryRepository.ExistsAsync(wi => wi.WarehouseId == entity.WarehouseId && !wi.IsDeleted);
        if (hasInventory)
            throw new InvalidOperationException("انبار دارای موجودی است و نمی‌تواند حذف شود");

        await _warehouseRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Get By Code
    public async Task<WarehouseDto?> GetByCodeAsync(string code)
    {
        var entity = await _warehouseRepository.GetByCodeAsync(code);
        if (entity == null)
            return null;

        var warehouseDto = _mapper.Map<WarehouseDto>(entity);
        warehouseDto.FarmerCode = await _userRepository.GetCodeByIdAsync(entity.FarmerId) ?? string.Empty;

        return warehouseDto;
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<WarehouseDto>> GetByFilterAsync(WarehouseFilterDto filter)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        Expression<Func<Warehouse, bool>> predicate = w => !w.IsDeleted;


        if (!string.IsNullOrEmpty(filter.Name))
            predicate = predicate.And(w => w.Name.Contains(filter.Name));

        var userRole = _currentUserService.Roles.FirstOrDefault(); // نقش فعلی کاربر
        if (userRole != "Manager") //  فقط مدیر می‌تونه آدرس‌های دیگران رو ببینه
        {
            predicate = predicate.And(a => a.Farmer.UserId == int.Parse(_currentUserService.UserId));
        }
        else if (!string.IsNullOrEmpty(filter.FarmerCode))
        {
            predicate = predicate.And(a => a.Farmer.Code == filter.FarmerCode);
        }

        return await _warehouseRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: w => new WarehouseDto
            {
                Code = w.Code,
                Name = w.Name,
                Address = w.Address,
                FarmerCode = w.Farmer.Code,
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt
            },
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: w => w.CreatedAt
        );
    }
    #endregion
}