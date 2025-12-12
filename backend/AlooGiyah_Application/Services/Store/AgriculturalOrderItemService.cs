using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Application.DTOs.AgriculturalOrderItem;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System.Linq.Expressions;

namespace AlooGiyah_Application.Services.Store;

public class AgriculturalOrderItemService : IAgriculturalOrderItemService
{
    #region Constructor
    private readonly IGenericRepository<AgriculturalOrderItem> _agriculturalOrderItemRepository;
    private readonly IGenericRepository<AgriculturalOrder> _agriculturalOrderRepository;
    private readonly IGenericRepository<AgriculturalProduct> _agriculturalProductRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AgriculturalOrderItemService(
        IGenericRepository<AgriculturalOrderItem> agriculturalOrderItemRepository,
        IGenericRepository<AgriculturalOrder> agriculturalOrderRepository,
        IGenericRepository<AgriculturalProduct> agriculturalProductRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _agriculturalOrderItemRepository = agriculturalOrderItemRepository;
        _agriculturalOrderRepository = agriculturalOrderRepository;
        _agriculturalProductRepository = agriculturalProductRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion


    #region Create
    public async Task<AgriculturalOrderItemDto> CreateAsync(AgriculturalOrderItemCreateDto dto, string orderCode)
    {
        // اعتبارسنجی سفارش
        var order = await _agriculturalOrderRepository.GetByCodeAsync(orderCode);
        if (order == null)
            throw new NotFoundException($"سفارش با کد {orderCode} پیدا نشد");

        // اعتبارسنجی محصول
        var product = await _agriculturalProductRepository.GetByCodeAsync(dto.AgriculturalProductCode);
        if (product == null)
            throw new NotFoundException($"محصول کشاورزی با کد {dto.AgriculturalProductCode} پیدا نشد");

        // چک کردن موجودی و تعداد
        if (dto.Quantity <= 0)
            throw new InvalidOperationException("تعداد محصول باید بیشتر از صفر باشد");

        if (product.Stock < dto.Quantity)
            throw new InvalidOperationException($"موجودی محصول {product.Name} کافی نیست");

        // به‌روزرسانی موجودی محصول
        product.Stock -= dto.Quantity;
        await _agriculturalProductRepository.UpdateAsync(product);

        var entity = _mapper.Map<AgriculturalOrderItem>(dto);
        entity.AgriculturalOrderId = order.AgriculturalOrderId;
        entity.AgriculturalProductId = product.AgriculturalProductId;

        await _agriculturalOrderItemRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        var itemDto = _mapper.Map<AgriculturalOrderItemDto>(entity);
        itemDto.AgriculturalProductCode = dto.AgriculturalProductCode;

        return itemDto;
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(AgriculturalOrderItemUpdateDto dto)
    {
        var entity = await _agriculturalOrderItemRepository.GetByCodeAsync(dto.Code);
        if (entity == null)
            return false;

        // برگرداندن موجودی قبلی
        var product = await _agriculturalProductRepository.GetByIdAsync(entity.AgriculturalProductId);
        if (product != null)
        {
            product.Stock += entity.Quantity;
            await _agriculturalProductRepository.UpdateAsync(product);
        }

        // چک کردن موجودی جدید
        if (dto.Quantity <= 0)
            throw new InvalidOperationException("تعداد محصول باید بیشتر از صفر باشد");

        if (dto.Price <= 0)
            throw new InvalidOperationException("قیمت محصول باید بیشتر از صفر باشد");

        if (product != null && product.Stock < dto.Quantity)
            throw new InvalidOperationException($"موجودی محصول {product.Name} کافی نیست");

        // به‌روزرسانی موجودی محصول
        if (product != null)
        {
            product.Stock -= dto.Quantity;
            await _agriculturalProductRepository.UpdateAsync(product);
        }

        entity.Quantity = dto.Quantity;
        entity.Price = dto.Price;

        await _agriculturalOrderItemRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var entity = await _agriculturalOrderItemRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        // برگرداندن موجودی به محصول
        var product = await _agriculturalProductRepository.GetByIdAsync(entity.AgriculturalProductId);
        if (product != null)
        {
            product.Stock += entity.Quantity;
            await _agriculturalProductRepository.UpdateAsync(product);
        }

        await _agriculturalOrderItemRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Get By Code
    public async Task<AgriculturalOrderItemDto?> GetByCodeAsync(string code)
    {
        var entity = await _agriculturalOrderItemRepository.GetByCodeAsync(code);
        if (entity == null)
            return null;

        var itemDto = _mapper.Map<AgriculturalOrderItemDto>(entity);
        itemDto.AgriculturalProductCode = await _agriculturalProductRepository.GetCodeByIdAsync(entity.AgriculturalProductId) ?? string.Empty;

        return itemDto;
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<AgriculturalOrderItemDto>> GetByFilterAsync(AgriculturalOrderItemFilterDto filter)
    {
        Expression<Func<AgriculturalOrderItem, bool>> predicate = oi => !oi.IsDeleted;

        if (!string.IsNullOrEmpty(filter.OrderCode))
            predicate = predicate.And(oi => oi.AgriculturalOrder.Code == filter.OrderCode);

        if (!string.IsNullOrEmpty(filter.ProductCode))
            predicate = predicate.And(oi => oi.AgriculturalProduct.Code == filter.ProductCode);

        if (filter.MinQuantity.HasValue)
            predicate = predicate.And(oi => oi.Quantity >= filter.MinQuantity.Value);

        if (filter.MaxQuantity.HasValue)
            predicate = predicate.And(oi => oi.Quantity <= filter.MaxQuantity.Value);

        if (filter.MinPrice.HasValue)
            predicate = predicate.And(oi => oi.Price >= filter.MinPrice.Value);

        if (filter.MaxPrice.HasValue)
            predicate = predicate.And(oi => oi.Price <= filter.MaxPrice.Value);

        return await _agriculturalOrderItemRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: oi => new AgriculturalOrderItemDto
            {
                Code = oi.Code,
                AgriculturalProductCode = oi.AgriculturalProduct.Code,
                Quantity = oi.Quantity,
                Price = oi.Price
            },
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: oi => oi.CreatedAt
        );
    }
    #endregion
}