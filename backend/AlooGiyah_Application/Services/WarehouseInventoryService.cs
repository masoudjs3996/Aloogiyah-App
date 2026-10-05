using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.Warehouse;
using AlooGiyah_Application.DTOs.WarehouseInventory;
using AlooGiyah_Application.Interfaces.Service;
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
    private readonly IWarehouseInventoryQuery _readQuery;

    #region Constructor
    private readonly IGenericRepository<WarehouseInventory> _warehouseInventoryRepository;
    private readonly IGenericRepository<Warehouse> _warehouseRepository;
    private readonly IGenericRepository<AgriculturalProduct> _agriculturalProductRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public WarehouseInventoryService(IWarehouseInventoryQuery readQuery,
        
        IGenericRepository<WarehouseInventory> warehouseInventoryRepository,
        IGenericRepository<Warehouse> warehouseRepository,
        IGenericRepository<AgriculturalProduct> agriculturalProductRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _readQuery = readQuery;
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
        return await _readQuery.GetByCodeAsync(code);
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<WarehouseInventoryDto>> GetByFilterAsync(WarehouseInventoryFilterDto filter)
    {
        return await _readQuery.GetByFilterAsync(filter);
    }
    #endregion
}