using AlooGiyah_Application.DTOs.OrderItem;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using System.Linq.Expressions;
using System.Security.Claims;

namespace AlooGiyah_Application.Services.Store;

public class OrderItemService : IOrderItemService
{
    #region Constructor
    private readonly IGenericRepository<OrderItem> _orderItemRepository;
    private readonly IGenericRepository<Order> _orderRepository;
    private readonly IGenericRepository<Product> _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public OrderItemService(
        IGenericRepository<OrderItem> orderItemRepository,
        IGenericRepository<Order> orderRepository,
        IGenericRepository<Product> productRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IHttpContextAccessor httpContextAccessor)
    {
        _orderItemRepository = orderItemRepository;
        _orderRepository = orderRepository;
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _httpContextAccessor = httpContextAccessor;
    }
    #endregion

    #region Private Methods
    private string GetUserRole()
    {
        return _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.Role)?.Value ?? "Customer";
    }
    #endregion

    #region Get by Filter
    public async Task<PagedResult<OrderItemDto?>> GetByFilterAsync(OrderItemFilterDto dto)
    {
        Expression<Func<OrderItem, bool>> predicate = oi => !oi.IsDeleted;

        if (!string.IsNullOrEmpty(dto.OrderCode))
            predicate = predicate.And(oi => oi.Order.Code == dto.OrderCode);

        if (!string.IsNullOrEmpty(dto.ProductCode))
            predicate = predicate.And(oi => oi.Product.Code == dto.ProductCode);

        if (!string.IsNullOrEmpty(dto.SearchTerm))
            predicate = predicate.And(oi => oi.Product.Name.Contains(dto.SearchTerm));

        return await _orderItemRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: oi => new OrderItemDto
            {
                OrderItemCode = oi.Code,
                ProductCode = oi.Product.Code,
                ProductName = oi.Product.Name,
                Quantity = oi.Quantity,
                Price = oi.Price,
                PriceType = oi.PriceType,
                OrderCode = oi.Order.Code
            },
            pageNumber: dto.PageNumber,
            pageSize: dto.PageSize,
            orderBy: oi => oi.CreatedAt
        );
    }
    #endregion

    #region Get by Code
    public async Task<OrderItemDto?> GetByCodeAsync(string orderItemCode)
    {
        var entity = await _orderItemRepository.GetByCodeAsync(orderItemCode);
        if (entity == null) return null;

        var orderCode = await _orderRepository.GetCodeByIdAsync(entity.OrderId);
        var productCode = await _productRepository.GetCodeByIdAsync(entity.ProductId);
        var orderItemDto = _mapper.Map<OrderItemDto>(entity);
        orderItemDto.OrderCode = orderCode ?? string.Empty;
        orderItemDto.ProductCode = productCode ?? string.Empty;
        orderItemDto.ProductName = entity.Product.Name;
        orderItemDto.PriceType = entity.PriceType;

        return orderItemDto;
    }
    #endregion

    #region Create
    public async Task<OrderItemDto> CreateAsync(OrderItemCreateDto dto)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            // بررسی سفارش
            var order = await _orderRepository.GetByCodeAsync(dto.OrderCode);
            if (order == null)
                throw new NotFoundException("سفارش پیدا نشد");

            // بررسی محصول
            var product = await _productRepository.GetByCodeAsync(dto.ProductCode);
            if (product == null)
                throw new NotFoundException($"محصول با کد {dto.ProductCode} پیدا نشد");

            // بررسی موجودی
            if (product.Stock < dto.Quantity)
                throw new InvalidOperationException(
                    $"موجودی محصول '{product.Name}' کافی نیست. موجودی فعلی: {product.Stock}، تعداد درخواستی: {dto.Quantity}"
                );

            // تعیین نقش کاربر و قیمت
            var userRole = GetUserRole();
            var price = userRole == "Partner" ? product.WholesalePrice : product.RetailPrice;

            // ایجاد آیتم سفارش
            var orderItem = new OrderItem
            {
                OrderId = order.OrderId,
                ProductId = product.ProductId,
                Quantity = dto.Quantity,
                Price = price * dto.Quantity,
                PriceType = userRole == "Partner" ? "Wholesale" : "Retail"
            };

            // اضافه کردن آیتم سفارش
            await _orderItemRepository.AddAsync(orderItem);

            // بروزرسانی موجودی محصول
            product.Stock -= dto.Quantity;
            await _productRepository.UpdateAsync(product);

            // بروزرسانی قیمت کل سفارش
            order.TotalPrice = order.OrderItems.Sum(oi => oi.Price) + orderItem.Price - order.DiscountAmount;
            await _orderRepository.UpdateAsync(order);

            // ذخیره تغییرات
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            // ساخت DTO خروجی
            var orderItemDto = _mapper.Map<OrderItemDto>(orderItem);
            orderItemDto.OrderCode = dto.OrderCode;
            orderItemDto.ProductCode = dto.ProductCode;
            orderItemDto.ProductName = product.Name;
            orderItemDto.PriceType = orderItem.PriceType;

            return orderItemDto;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(OrderItemUpdateDto dto)
    {
       await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var existing = await _orderItemRepository.GetByCodeAsync(dto.OrderItemCode);
            if (existing == null)
                throw new NotFoundException($"آیتم با کد {dto.OrderItemCode} پیدا نشد");

            var product = await _productRepository.GetByCodeAsync(dto.ProductCode);
            if (product == null)
                throw new NotFoundException($"محصول با کد {dto.ProductCode} پیدا نشد");

            var quantityDifference = dto.Quantity - existing.Quantity;
            if (product.Stock < quantityDifference)
                throw new InvalidOperationException($"موجودی محصول '{product.Name}' کافی نیست. موجودی فعلی: {product.Stock}، تعداد درخواستی: {dto.Quantity}");

            var userRole = GetUserRole();
            var price = userRole == "Partner" ? product.WholesalePrice : product.RetailPrice;
            existing.ProductId = product.ProductId;
            existing.Quantity = dto.Quantity;
            existing.Price = price * dto.Quantity;
            existing.PriceType = userRole == "Partner" ? "Wholesale" : "Retail";

            await _orderItemRepository.UpdateAsync(existing); // خط 158: اطمینان از عدم اختصاص به var
            product.Stock -= quantityDifference;
            await _productRepository.UpdateAsync(product);

            var order = await _orderRepository.GetByIdAsync(existing.OrderId);
            if (order != null)
            {
                order.TotalPrice = order.OrderItems.Sum(oi => oi.Price) - order.DiscountAmount;
                await _orderRepository.UpdateAsync(order);
            }

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(int orderItemId)
    {
       await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var existing = await _orderItemRepository.GetByIdAsync(orderItemId);
            if (existing == null) return false;

            var product = await _productRepository.GetByIdAsync(existing.ProductId);
            if (product != null)
            {
                product.Stock += existing.Quantity;
                await _productRepository.UpdateAsync(product);
            }

            await _orderItemRepository.DeleteAsync(existing); // خط 207: اطمینان از عدم اختصاص به var

            var order = await _orderRepository.GetByIdAsync(existing.OrderId);
            if (order != null)
            {
                order.TotalPrice = order.OrderItems.Sum(oi => oi.Price) - order.DiscountAmount;
                await _orderRepository.UpdateAsync(order);
            }

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    #endregion
}