using AlooGiyah_Application.DTOs.Order;
using AlooGiyah_Application.DTOs.OrderItem;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Application.Interfaces.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;

using System.Linq.Expressions;

namespace AlooGiyah_Application.Services.Store;

public class OrderService : IOrderService
{
    #region Constructor
    private readonly IGenericRepository<Order> _orderRepository;
    private readonly IGenericRepository<OrderItem> _orderItemRepository;
    private readonly IGenericRepository<Product> _productRepository;
    private readonly IGenericRepository<Status> _statusRepository;
    private readonly IGenericRepository<Address> _addressRepository;
    private readonly IGenericRepository<Discount> _discountRepository;
    private readonly IPriceCalculatorService _priceCalculator;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    

    public OrderService(
        IGenericRepository<Order> orderRepository,
        IGenericRepository<OrderItem> orderItemRepository,
        IGenericRepository<Product> productRepository,
        IGenericRepository<Status> statusRepository,
        IGenericRepository<Address> addressRepository,
        IGenericRepository<Discount> discountRepository,
        IPriceCalculatorService priceCalculator,    
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _orderRepository = orderRepository;
        _orderItemRepository = orderItemRepository;
        _currentUserService = currentUserService;
        _productRepository = productRepository;
        _statusRepository = statusRepository;
        _addressRepository = addressRepository;
        _discountRepository = discountRepository;
        _priceCalculator = priceCalculator;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion


    #region Create
    public async Task<OrderDto> CreateAsync(OrderCreateDto dto)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            if (string.IsNullOrEmpty(_currentUserService.UserId))
                throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserId is required from token.");

            var userId = int.Parse(_currentUserService.UserId);

            int? addressId = null;
            if (!string.IsNullOrEmpty(dto.AddressCode))
            {
                addressId = await _addressRepository.GetIdByCodeAsync(dto.AddressCode, a => a.AddressId);
                if (addressId == null)
                    throw new NotFoundException("آدرس پیدا نشد");
            }

            Discount? discount = null;
            if (!string.IsNullOrEmpty(dto.DiscountCode))
            {
                discount = await _discountRepository.GetByCodeAsync(dto.DiscountCode);
                if (discount == null || !discount.IsActive)
                    throw new NotFoundException("کد تخفیف معتبر نیست");
            }

            // var userRole = GetUserRole(); // بعداً می‌تونی از توکن بگیری
            var order = new Order
            {
                UserId = userId,
                AddressId = addressId,
                DiscountId = discount?.DiscountId,
                DiscountAmount = 0,
                TotalPrice = 0,
                StatusId = (await _statusRepository.GetByCodeAsync("PendingApproval"))?.StatusId
                    ?? throw new NotFoundException("وضعیت در انتظار تأیید یافت نشد"),
                IsPaid = false,
                OrderItems = new List<OrderItem>()
            };

            await _orderRepository.AddAsync(order);

            // ایجاد آیتم‌های سفارش
            foreach (var item in dto.Items)
            {
                var product = await _productRepository.GetByCodeAsync(item.ProductCode);
                if (product == null)
                    throw new NotFoundException($"محصول با کد {item.ProductCode} پیدا نشد");

                if (product.Stock < item.Quantity)
                    throw new InvalidOperationException(
                        $"موجودی محصول '{product.Name}' کافی نیست. موجودی فعلی: {product.Stock}، تعداد درخواستی: {item.Quantity}");

                var orderItem = new OrderItem
                {
                    OrderId = order.OrderId,
                    ProductId = product.ProductId,
                    Quantity = item.Quantity,
                    // قیمت‌گذاری بعداً توسط PriceCalculatorService انجام میشه
                };

                await _orderItemRepository.AddAsync(orderItem);

                // کاهش موجودی محصول
                product.Stock -= item.Quantity;
                await _productRepository.UpdateAsync(product);

                order.OrderItems.Add(orderItem);
            }

            // محاسبه قیمت نهایی با سرویس
            order.TotalPrice = _priceCalculator.CalculateOrder(order /*, userRole*/);
            order.DiscountAmount = order.DiscountAmount; // داخل PriceCalculator پر میشه

            // آپدیت تخفیف (استفاده‌شده)
            if (discount != null)
            {
                discount.UsageCount++;
                await _discountRepository.UpdateAsync(discount);
            }

            await _orderRepository.UpdateAsync(order);
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            // مپ به DTO
            var orderDto = _mapper.Map<OrderDto>(order);
            orderDto.StatusCode = await _statusRepository.GetCodeByIdAsync(order.StatusId) ?? string.Empty;
            orderDto.AddressCode = order.AddressId.HasValue
                ? await _addressRepository.GetCodeByIdAsync(order.AddressId.Value)
                : null;
            orderDto.DiscountCode = order.DiscountId.HasValue
                ? await _discountRepository.GetCodeByIdAsync(order.DiscountId.Value)
                : null;

            return orderDto;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    #endregion

    #region Get By Filter
    public async Task<PagedResult<OrderDto>> GetByFilterAsync(OrderFilterDto dto)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        Expression<Func<Order, bool>> predicate = o => !o.IsDeleted;

      

        var userRole = _currentUserService.Roles.FirstOrDefault(); // نقش فعلی کاربر
        if (userRole != "Manager") //  فقط مدیر می‌تونه آدرس‌های دیگران رو ببینه
        {
            predicate = predicate.And(a => a.User.UserId == int.Parse(_currentUserService.UserId));
        }
        else if (!string.IsNullOrEmpty(dto.UserCode)) 
        {
            predicate = predicate.And(a => a.User.Code == dto.UserCode);
        }

        if (!string.IsNullOrEmpty(dto.StatusCode))
            predicate = predicate.And(o => o.Status.Code == dto.StatusCode);

        if (!string.IsNullOrEmpty(dto.SearchTerm))
            predicate = predicate.And(o => o.Code.Contains(dto.SearchTerm));

        return await _orderRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: o => new OrderDto
            {
                Code = o.Code,
                StatusCode = o.Status.Code,
                TotalPrice = o.TotalPrice,
                DiscountAmount = o.DiscountAmount,
                AddressCode = o.Address != null ? o.Address.Code : null,
                DiscountCode = o.Discount != null ? o.Discount.Code : null,
                IsPaid = o.IsPaid,
                PaymentDate = o.PaymentDate,
                PaymentReference = o.PaymentReference,
                Items = o.OrderItems.Select(oi => new OrderItemDto
                {
                    OrderItemCode = oi.Code,
                    ProductCode = oi.Product.Code,
                    ProductName = oi.Product.Name,
                    Quantity = oi.Quantity,
                    Price = oi.Price,
                    PriceType = oi.PriceType
                }).ToList()
            },
            pageNumber: dto.PageNumber,
            pageSize: dto.PageSize,
            orderBy: o => o.CreatedAt
        );
    }
    #endregion

    #region Get By Code
    public async Task<OrderDto?> GetByCodeAsync(string orderCode)
    {
        if (string.IsNullOrEmpty(orderCode))
            throw new ArgumentNullException(nameof(orderCode));

        var entity = await _orderRepository.GetByCodeWithIncludeAsync(
            code: orderCode,
            includes: new Expression<Func<Order, object>>[] { o => o.OrderItems, o => o.User, o => o.Status, o => o.Address, o => o.Discount });

        if (entity == null) return null;

        var orderDto = _mapper.Map<OrderDto>(entity);
        orderDto.UserCode = entity.User?.Code ?? string.Empty;
        orderDto.StatusCode = entity.Status?.Code ?? string.Empty;
        orderDto.AddressCode = entity.AddressId.HasValue ? entity.Address?.Code : null;
        orderDto.DiscountCode = entity.DiscountId.HasValue ? entity.Discount?.Code : null;
        orderDto.Items = entity.OrderItems.Select(oi => new OrderItemDto
        {
            OrderItemCode = oi.Code,
            ProductCode = oi.Product.Code,
            ProductName = oi.Product.Name,
            Quantity = oi.Quantity,
            Price = oi.Price,
            PriceType = oi.PriceType
        }).ToList();

        return orderDto;
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(OrderUpdateDto dto)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var order = await _orderRepository.GetByCodeWithIncludeAsync(
                code: dto.OrderCode,
                includes: new Expression<Func<Order, object>>[] { o => o.OrderItems });

            if (order == null) return false;

            int? addressId = null;
            if (!string.IsNullOrEmpty(dto.AddressCode))
            {
                addressId = await _addressRepository.GetIdByCodeAsync(dto.AddressCode, a => a.AddressId);
                if (addressId == null)
                    throw new NotFoundException("آدرس پیدا نشد");
            }

            if (string.IsNullOrEmpty(dto.StatusCode))
                throw new InvalidOperationException("کد وضعیت الزامی است");

            var statusId = await _statusRepository.GetIdByCodeAsync(dto.StatusCode, s => s.StatusId);
            if (statusId == null)
                throw new NotFoundException($"وضعیت {dto.StatusCode} نامعتبر است");

            Discount? discount = null;
            if (!string.IsNullOrEmpty(dto.DiscountCode))
            {
                discount = await _discountRepository.GetByCodeAsync(dto.DiscountCode);
                if (discount == null || !discount.IsActive)
                    throw new NotFoundException("کد تخفیف معتبر نیست");
            }

            // ساخت دیکشنری برای آیتم‌ها
            var existingItems = order.OrderItems.ToDictionary(oi => oi.Code, oi => oi);
            var newItems = dto.Items.ToDictionary(i => i.OrderItemCode, i => i);

            // حذف آیتم‌هایی که دیگر در dto وجود ندارند
            foreach (var item in order.OrderItems.ToList())
            {
                if (!newItems.ContainsKey(item.Code))
                {
                    var product = await _productRepository.GetByIdAsync(item.ProductId);
                    if (product != null)
                    {
                        product.Stock += item.Quantity;
                        await _productRepository.UpdateAsync(product);
                    }
                    await _orderItemRepository.DeleteAsync(item);
                }
            }

            // اضافه کردن یا به‌روزرسانی آیتم‌ها
            foreach (var item in dto.Items)
            {
                var product = await _productRepository.GetByCodeAsync(item.ProductCode);
                if (product == null)
                    throw new NotFoundException($"محصول با کد {item.ProductCode} پیدا نشد");

                if (product.Stock < item.Quantity)
                    throw new InvalidOperationException(
                        $"موجودی محصول '{product.Name}' کافی نیست. موجودی فعلی: {product.Stock}، تعداد درخواستی: {item.Quantity}");

                if (existingItems.TryGetValue(item.OrderItemCode, out var existingItem))
                {
                    var quantityDifference = item.Quantity - existingItem.Quantity;
                    existingItem.Quantity = item.Quantity;
                    await _orderItemRepository.UpdateAsync(existingItem);

                    product.Stock -= quantityDifference;
                }
                else
                {
                    var orderItem = new OrderItem
                    {
                        OrderId = order.OrderId,
                        ProductId = product.ProductId,
                        Quantity = item.Quantity,
                    };
                    await _orderItemRepository.AddAsync(orderItem);
                    product.Stock -= item.Quantity;

                    order.OrderItems.Add(orderItem);
                }

                await _productRepository.UpdateAsync(product);
            }

            // محاسبه قیمت نهایی با سرویس
            order.DiscountId = discount?.DiscountId;
            order.TotalPrice = _priceCalculator.CalculateOrder(order /*, userRole*/);
            order.DiscountAmount = order.DiscountAmount; // داخل PriceCalculator مقداردهی میشه

            // آپدیت تخفیف (استفاده‌شده)
            if (discount != null)
            {
                discount.UsageCount++;
                await _discountRepository.UpdateAsync(discount);
            }

            order.AddressId = addressId;
            order.StatusId = statusId.Value;

            await _orderRepository.UpdateAsync(order);
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

    #region Approve Order
    public async Task<bool> ApproveOrderAsync(ApproveOrderDto orderDto)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var order = await _orderRepository.GetByCodeWithIncludeAsync(
                code: orderDto.OrderCode,
                includes: new Expression<Func<Order, object>>[] { o => o.OrderItems });

            if (order == null)
                throw new NotFoundException("سفارش پیدا نشد");
            if (order.Status.Code != "PendingApproval")
                throw new InvalidOperationException("سفارش در وضعیت در انتظار تأیید نیست");

            foreach (var item in order.OrderItems)
            {
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product == null || product.Stock < item.Quantity)
                    throw new InvalidOperationException($"موجودی محصول '{product?.Name}' کافی نیست. موجودی فعلی: {product?.Stock ?? 0}");
            }

            order.StatusId = (await _statusRepository.GetByCodeAsync("Approved"))?.StatusId
                ?? throw new NotFoundException("وضعیت تأیید شده یافت نشد");

            await _orderRepository.UpdateAsync(order);
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

    #region Prepare for Shipment
    public async Task<bool> PrepareForShipmentAsync(string orderCode)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var order = await _orderRepository.GetByCodeAsync(orderCode);
            if (order == null)
                throw new NotFoundException("سفارش پیدا نشد");
            if (order.Status.Code != "Paid")
                throw new InvalidOperationException("سفارش هنوز پرداخت نشده است");

            order.StatusId = (await _statusRepository.GetByCodeAsync("ReadyForShipment"))?.StatusId
                ?? throw new NotFoundException("وضعیت آماده ارسال یافت نشد");

            await _orderRepository.UpdateAsync(order);
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