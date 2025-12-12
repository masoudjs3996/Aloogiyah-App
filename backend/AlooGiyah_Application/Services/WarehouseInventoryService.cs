using AlooGiyah_Application.DTOs.Warehouse;
using AlooGiyah_Application.DTOs.WarehouseInventory;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System.Linq.Expressions;

namespace AlooGiyah_Application.Services;

public class WarehouseInventoryService : IWarehouseInventoryService
{
    #region Constructor
    private readonly IGenericRepository<WarehouseInventory> _warehouseInventoryRepository;
    private readonly IGenericRepository<Warehouse> _warehouseRepository;
    private readonly IGenericRepository<AgriculturalProduct> _agriculturalProductRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public WarehouseInventoryService(
        IGenericRepository<WarehouseInventory> warehouseInventoryRepository,
        IGenericRepository<Warehouse> warehouseRepository,
        IGenericRepository<AgriculturalProduct> agriculturalProductRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _warehouseInventoryRepository = warehouseInventoryRepository;
        _warehouseRepository = warehouseRepository;
        _agriculturalProductRepository = agriculturalProductRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion
    

    #region Create
    public async Task<WarehouseInventoryDto> CreateAsync(WarehouseInventoryCreateDto dto)
    {
        // اعتبارسنجی انبار
        var warehouseId = await _warehouseRepository.GetIdByCodeAsync(dto.WarehouseCode, w => w.WarehouseId);
        if (warehouseId == null)
            throw new NotFoundException($"انبار با کد {dto.WarehouseCode} پیدا نشد");

        // اعتبارسنجی موجودیت
        int? entityId = null;
        switch (dto.EntityWarehouse)
        {
            case EntityWarehouseInventory.AgriculturalProduct:
                entityId = await _agriculturalProductRepository.GetIdByCodeAsync(dto.EntityCode, p => p.AgriculturalProductId);
                if (entityId == null)
                    throw new NotFoundException($"محصول کشاورزی با کد {dto.EntityCode} پیدا نشد");
                break;
            // برای سایر EntityType‌ها می‌تونی repositoryهای مربوطه رو اضافه کنی
            default:
                throw new InvalidOperationException($"نوع موجودیت '{dto.EntityWarehouse}' پشتیبانی نمی‌شود");
        }

        // اعتبارسنجی تعداد
        if (dto.Quantity < 0)
            throw new InvalidOperationException("تعداد موجودی نمی‌تواند منفی باشد");

        // چک کردن وجود موجودی مشابه
        var exists = await _warehouseInventoryRepository.ExistsAsync(wi => wi.WarehouseId == warehouseId && wi.EntityId == entityId && wi.EntityWarehouse == dto.EntityWarehouse && !wi.IsDeleted);
        if (exists)
            throw new InvalidOperationException($"موجودی برای این موجودیت در انبار قبلاً ثبت شده است");

        var entity = _mapper.Map<WarehouseInventory>(dto);
        entity.WarehouseId = warehouseId.Value;
        entity.EntityId = entityId.Value;

        await _warehouseInventoryRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        var inventoryDto = _mapper.Map<WarehouseInventoryDto>(entity);
        inventoryDto.WarehouseCode = dto.WarehouseCode;
        inventoryDto.EntityCode = dto.EntityCode;

        return inventoryDto;
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(WarehouseInventoryUpdateDto dto)
    {
        var entity = await _warehouseInventoryRepository.GetByCodeAsync(dto.Code);
        if (entity == null)
            return false;

        // اعتبارسنجی تعداد
        if (dto.Quantity < 0)
            throw new InvalidOperationException("تعداد موجودی نمی‌تواند منفی باشد");

        entity.Quantity = dto.Quantity;
        entity.LastRestockDate = dto.LastRestockDate;

        await _warehouseInventoryRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var entity = await _warehouseInventoryRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        await _warehouseInventoryRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Get By Code
    public async Task<WarehouseInventoryDto?> GetByCodeAsync(string code)
    {
        var entity = await _warehouseInventoryRepository.GetByCodeAsync(code);
        if (entity == null)
            return null;

        var inventoryDto = _mapper.Map<WarehouseInventoryDto>(entity);
        inventoryDto.WarehouseCode = await _warehouseRepository.GetCodeByIdAsync(entity.WarehouseId) ?? string.Empty;

        switch (entity.EntityWarehouse)
        {
            case EntityWarehouseInventory.AgriculturalProduct:
                inventoryDto.EntityCode = await _agriculturalProductRepository.GetCodeByIdAsync(entity.EntityId) ?? string.Empty;
                break;
            // برای سایر EntityType‌ها می‌تونی repositoryهای مربوطه رو اضافه کنی
            default:
                inventoryDto.EntityCode = string.Empty;
                break;
        }

        return inventoryDto;
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<WarehouseInventoryDto>> GetByFilterAsync(WarehouseInventoryFilterDto filter)
    {
        Expression<Func<WarehouseInventory, bool>> predicate = wi => !wi.IsDeleted;

        if (!string.IsNullOrEmpty(filter.WarehouseCode))
            predicate = predicate.And(wi => wi.Warehouse.Code == filter.WarehouseCode);

        if (!string.IsNullOrEmpty(filter.EntityCode))
            predicate = predicate.And(wi => wi.EntityWarehouse == filter.EntityWarehouse);

        if (filter.EntityWarehouse.HasValue)
            predicate = predicate.And(wi => wi.EntityWarehouse == filter.EntityWarehouse.Value);

        if (filter.MinQuantity.HasValue)
            predicate = predicate.And(wi => wi.Quantity >= filter.MinQuantity.Value);

        if (filter.MaxQuantity.HasValue)
            predicate = predicate.And(wi => wi.Quantity <= filter.MaxQuantity.Value);

        if (filter.LastRestockFrom.HasValue)
            predicate = predicate.And(wi => wi.LastRestockDate >= filter.LastRestockFrom.Value);

        if (filter.LastRestockTo.HasValue)
            predicate = predicate.And(wi => wi.LastRestockDate <= filter.LastRestockTo.Value);

        // گرفتن داده‌ها
        var inventories = await _warehouseInventoryRepository.GetPagedWithIncludeAsync(
            filter: predicate,
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: wi => wi.CreatedAt,
            includes: new Expression<Func<WarehouseInventory, object>>[] { wi => wi.Warehouse }
        );

        // پروجکشن دستی برای پر کردن EntityCode
        var dtos = new List<WarehouseInventoryDto>();
        foreach (var wi in inventories.Items)
        {
            string entityCode = string.Empty;
            if (wi.EntityWarehouse == EntityWarehouseInventory.AgriculturalProduct)
            {
                entityCode = await _agriculturalProductRepository.GetCodeByIdAsync(wi.EntityId) ?? string.Empty;
            }
            // برای سایر EntityType‌ها می‌تونی شرط اضافه کنی

            dtos.Add(new WarehouseInventoryDto
            {
                Code = wi.Code,
                WarehouseCode = wi.Warehouse.Code,
                EntityCode = entityCode,
                EntityWarehouse = wi.EntityWarehouse,
                Quantity = wi.Quantity,
                LastRestockDate = wi.LastRestockDate,
                CreatedAt = wi.CreatedAt,
                UpdatedAt = wi.UpdatedAt
            });
        }

        return new PagedResult<WarehouseInventoryDto>
        {
            Items = dtos,
            TotalCount = inventories.TotalCount,
            PageNumber = inventories.PageNumber,
            PageSize = inventories.PageSize
        };
    }
    #endregion
}