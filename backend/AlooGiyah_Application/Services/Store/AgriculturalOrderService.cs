using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Application.DTOs.AgriculturalOrderItem;
using AlooGiyah_Application.DTOs.Cart;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Application.Interfaces.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System.Linq.Expressions;

namespace AlooGiyah_Application.Services.Store;

public class AgriculturalOrderService : IAgriculturalOrderService
{
    #region Constructor
    private readonly IGenericRepository<AgriculturalOrder> _agriculturalOrderRepository;
    private readonly IGenericRepository<Status> _statusRepository;
    private readonly IGenericRepository<AgriculturalProduct> _agriculturalProductRepository;
    private readonly IGenericRepository<AgriculturalOrderItem> _agriculturalOrderItemRepository;
    private readonly IGenericRepository<Address> _addressRepository;
    private readonly IGenericRepository<Discount> _discountRepository;
    private readonly IGenericRepository<User> _userRepository;
    private readonly ICartService _cartService;
    private readonly IDiscountService _discountService;
    private readonly IPaymentGatewayService _paymentGatewayService;
    private readonly IWalletService _walletService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPriceCalculatorService _priceCalculatorService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AgriculturalOrderService(
        IGenericRepository<AgriculturalOrder> agriculturalOrderRepository,
        IGenericRepository<Status> statusRepository,
        IGenericRepository<AgriculturalProduct> agriculturalProductRepository,
        IGenericRepository<AgriculturalOrderItem> agriculturalOrderItemRepository,
        IGenericRepository<Address> addressRepository,
        IGenericRepository<Discount> discountRepository,
        IGenericRepository<User> userRepository,
        ICartService cartService,
    IDiscountService discountService,
        IPaymentGatewayService paymentGatewayService,
        IWalletService walletService,
        ICurrentUserService currentUserService,
        IPriceCalculatorService priceCalculatorService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _agriculturalOrderRepository = agriculturalOrderRepository;
        _statusRepository = statusRepository;
        _agriculturalProductRepository = agriculturalProductRepository;
        _agriculturalOrderItemRepository = agriculturalOrderItemRepository;
        _addressRepository = addressRepository;
        _discountRepository = discountRepository;
        _userRepository = userRepository;
        _cartService = cartService;
        _discountService = discountService;
        _paymentGatewayService = paymentGatewayService;
        _walletService = walletService;
        _currentUserService = currentUserService;
        _priceCalculatorService = priceCalculatorService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion


    #region Create
    public async Task<AgriculturalOrderDto> CreateAsync(AgriculturalOrderCreateDto dto)
    {
        var buyerId = int.Parse(_currentUserService.UserId);
        var userRole = _currentUserService.Roles.FirstOrDefault() ?? "User";

        if (string.IsNullOrEmpty(dto.AddressCode))
            throw new InvalidOperationException("انتخاب آدرس تحویل برای ثبت سفارش الزامی است.");

        var address = await _addressRepository.GetByCodeAsync(dto.AddressCode)
                      ?? throw new NotFoundException("آدرس یافت نشد");

        // چک مالکیت آدرس
        if ( address.UserId != buyerId)
            throw new UnauthorizedException("آدرس انتخاب شده متعلق به شما نیست");
        var pendingStatus = await _statusRepository.FirstOrDefaultAsync(s => s.Code == "3EFC703625")
                            ?? throw new NotFoundException("pending پیدا نشد");

        var orderItems = new List<AgriculturalOrderItem>();
        foreach (var itemDto in dto.OrderItems)
        {
            var product = await _agriculturalProductRepository.GetByCodeAsync(itemDto.AgriculturalProductCode)
                          ?? throw new NotFoundException($"محصول {itemDto.AgriculturalProductCode} پیدا نشد");

            if (product.Stock < itemDto.Quantity)
                throw new InvalidOperationException($"موجودی محصول {product.Name} کافی نیست");

            var price = userRole == "User" ? product.RetailPrice : product.WholesalePrice;

            orderItems.Add(new AgriculturalOrderItem
            {
                AgriculturalProductId = product.AgriculturalProductId,
                Quantity = itemDto.Quantity,
                Price = price,
                AgriculturalProduct = product
            });
        }

        var order = new AgriculturalOrder
        {
            BuyerId = buyerId,
            AddressId = address.AddressId,  // ممکنه null باشه
            StatusId = pendingStatus.StatusId,
            AgriculturalOrderItems = orderItems,
            IsPaid = false
        };

        await using var tx = await _unitOfWork.BeginTransactionAsync();
        try
        {
            if (!string.IsNullOrEmpty(dto.DiscountCode))
            {
                var discount = await _discountRepository.GetByCodeAsync(dto.DiscountCode);
                if (discount != null)
                {
                    var buyer = await _userRepository.GetByIdAsync(buyerId);
                    if (buyer != null && _priceCalculatorService.IsDiscountValid(discount, buyer.Code))
                    {
                        bool eligible = false;
                        foreach (var item in orderItems)
                        {
                            var product = await _agriculturalProductRepository.GetByIdAsync(item.AgriculturalProductId);
                            if (product != null && await _priceCalculatorService.IsProductEligibleForDiscountAsync(product, discount))
                            {
                                eligible = true;
                                break;
                            }
                        }
                        if (eligible)
                        {
                            order.DiscountId = discount.DiscountId;
                            order.Discount = discount;
                            discount.UsageCount++;
                            await _discountRepository.UpdateAsync(discount);
                        }
                    }
                }
            }

            order.TotalPrice = await _priceCalculatorService.CalculateAgriculturalOrder(order, userRole);

            await _agriculturalOrderRepository.AddAsync(order);
            await _unitOfWork.SaveChangesAsync();
            await tx.CommitAsync();

            var freshOrder = await _agriculturalOrderRepository.GetByCodeWithIncludeAsync(
                order.Code,
                "Buyer",
                "Status",
                "Address",
                "Discount",
                "AgriculturalOrderItems.AgriculturalProduct");

            return _mapper.Map<AgriculturalOrderDto>(freshOrder);
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
    #endregion

    #region CreateFromCartAsync
    public async Task<AgriculturalOrderDto> CreateFromCartAsync(CheckoutFromCartDto dto)
    {
        var userId = int.Parse(_currentUserService.UserId);

        CartDto cart;

        if (dto.CartId.HasValue)
        {
            // گرفتن سبد خاص
            cart = await _cartService.GetCartByIdAsync(dto.CartId.Value)
                   ?? throw new NotFoundException("سبد خرید موردنظر یافت نشد");
        }
        else
        {
            // fallback → اولین سبد (یا ارور بده)
            var carts = await _cartService.GetCartsAsync();
            cart = carts.FirstOrDefault()
                   ?? throw new InvalidOperationException("هیچ سبد خریدی یافت نشد");
        }

        if (cart.ItemCount == 0)
            throw new InvalidOperationException("سبد خرید خالی است");

        // گرفتن و چک آدرس
        var address = await _addressRepository.GetByCodeAsync(dto.AddressCode)
                      ?? throw new NotFoundException("آدرس یافت نشد");

        if (address.UserId != userId)
            throw new UnauthorizedException("آدرس متعلق به شما نیست");

        var pendingStatus = await _statusRepository.FirstOrDefaultAsync(s => s.Code == "3EFC703625")
                            ?? throw new NotFoundException("وضعیت pending یافت نشد");

        var order = new AgriculturalOrder
        {
            BuyerId = userId,
            AddressId = address.AddressId,
            StatusId = pendingStatus.StatusId,
            IsPaid = false,
            AgriculturalOrderItems = new List<AgriculturalOrderItem>()
        };

        // تبدیل آیتم‌های سبد به سفارش
        foreach (var item in cart.CartItems)
        {
            var product = await _agriculturalProductRepository.GetByCodeAsync(item.ProductCode)
                          ?? throw new InvalidOperationException($"محصول با کد {item.ProductCode} یافت نشد");

            if (product.Stock < item.Quantity)
                throw new InvalidOperationException($"موجودی محصول {item.ProductName} کافی نیست");

            product.Stock -= item.Quantity;
            await _agriculturalProductRepository.UpdateAsync(product);

            order.AgriculturalOrderItems.Add(new AgriculturalOrderItem
            {
                AgriculturalProductId = product.AgriculturalProductId,
                Quantity = item.Quantity,
                Price = item.UnitPrice
            });
        }

        // اعمال تخفیف اگر داشت
        if (!string.IsNullOrEmpty(dto.DiscountCode))
        {
            // منطق تخفیف...
        }

        order.TotalPrice = cart.TotalPrice;

        await _agriculturalOrderRepository.AddAsync(order);
        await _unitOfWork.SaveChangesAsync();

        // پاک کردن سبد خرید
        await _cartService.ClearCartAsync();

        return _mapper.Map<AgriculturalOrderDto>(order);
    }
    #endregion

    #region Update 
    public async Task<bool> UpdateAsync(AgriculturalOrderUpdateDto dto)
    {
        var userRole = _currentUserService.Roles.FirstOrDefault() ?? "User";

        // درست گرفتن سفارش با روابط
        var entity = await _agriculturalOrderRepository.GetByCodeWithIncludeAsync(
            dto.Code,
            "AgriculturalOrderItems.AgriculturalProduct",
            "Discount",
            "Buyer",
            "Status",
            "Address"   
        );

        if (entity == null)
            return false;

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            bool discountChanged = false;
            int? previousDiscountId = entity.DiscountId;

            if (!string.IsNullOrEmpty(dto.StatusCode))
            {
                var newStatus = await _statusRepository.FirstOrDefaultAsync(s => s.Code == dto.StatusCode);

                var statusId = newStatus?.StatusId
                               ?? throw new NotFoundException($"وضعیت با کد {dto.StatusCode} پیدا نشد");
                entity.StatusId = statusId;
            }

            // تغییر آدرس (اختیاری)
            if (!string.IsNullOrEmpty(dto.AddressCode))
            {
                var address = await _addressRepository.GetByCodeAsync(dto.AddressCode)
                              ?? throw new NotFoundException($"آدرس با کد {dto.AddressCode} پیدا نشد");

                // چک مالکیت آدرس
                if (address.UserId != entity.BuyerId)
                    throw new UnauthorizedException("آدرس انتخاب شده متعلق به شما نیست.");

                entity.AddressId = address.AddressId;
            }

            // تغییر تخفیف
            if (dto.DiscountCode != null)
            {
                // اگر قبلاً تخفیف داشت، UsageCount رو کم نکن (چون قبلاً افزایش دادی)
                if (entity.DiscountId.HasValue && entity.DiscountId.ToString() != dto.DiscountCode)
                {
                    // تخفیف قبلی رو آزاد نکن (سیستم ساده)
                }

                entity.DiscountId = null;

                if (!string.IsNullOrEmpty(dto.DiscountCode))
                {
                    var discount = await _discountRepository.GetByCodeAsync(dto.DiscountCode)
                                   ?? throw new NotFoundException($"تخفیف با کد {dto.DiscountCode} پیدا نشد");

                    var buyer = await _userRepository.GetByIdAsync(entity.BuyerId);
                    if (buyer != null && _priceCalculatorService.IsDiscountValid(discount, buyer.Code))
                    {
                        bool eligible = false;
                        foreach (var item in entity.AgriculturalOrderItems)
                        {
                            var product = item.AgriculturalProduct ??
                                         await _agriculturalProductRepository.GetByIdAsync(item.AgriculturalProductId);
                            if (product != null && await _priceCalculatorService.IsProductEligibleForDiscountAsync(product, discount))
                            {
                                eligible = true;
                                break;
                            }
                        }

                        if (eligible)
                        {
                            entity.DiscountId = discount.DiscountId;
                            discount.UsageCount++;
                            await _discountRepository.UpdateAsync(discount);
                            discountChanged = true;
                        }
                    }
                }
            }

            // پرداخت
            if (dto.IsPaid.HasValue) entity.IsPaid = dto.IsPaid.Value;
            if (dto.PaymentDate.HasValue) entity.PaymentDate = dto.PaymentDate.Value;
            if (dto.PaymentReference != null) entity.PaymentReference = dto.PaymentReference;

            // آیتم‌ها — کاملاً امن و درست
            var existingItems = entity.AgriculturalOrderItems.ToDictionary(i => i.Code, i => i);
            var newItems = new List<AgriculturalOrderItem>();

            foreach (var itemDto in dto.OrderItems ?? new List<AgriculturalOrderItemUpdateDto>())
            {
                if (!string.IsNullOrEmpty(itemDto.Code) && existingItems.TryGetValue(itemDto.Code, out var existingItem))
                {
                    var product = existingItem.AgriculturalProduct ??
                                 await _agriculturalProductRepository.GetByIdAsync(existingItem.AgriculturalProductId);

                    if (product == null) throw new InvalidOperationException("محصول پیدا نشد");

                    var stockDiff = itemDto.Quantity - existingItem.Quantity;
                    if (stockDiff > 0 && product.Stock < stockDiff)
                        throw new InvalidOperationException($"موجودی {product.Name} کافی نیست");

                    product.Stock -= stockDiff;
                    await _agriculturalProductRepository.UpdateAsync(product);

                    existingItem.Quantity = itemDto.Quantity;
                    existingItem.Price = userRole == "User" ? product.RetailPrice : product.WholesalePrice;
                    newItems.Add(existingItem);
                    existingItems.Remove(itemDto.Code);
                }
                else if (!string.IsNullOrEmpty(itemDto.AgriculturalProductCode))
                {
                    var product = await _agriculturalProductRepository.GetByCodeAsync(itemDto.AgriculturalProductCode)
                                  ?? throw new NotFoundException($"محصول با کد {itemDto.AgriculturalProductCode} پیدا نشد");

                    if (itemDto.Quantity <= 0) throw new InvalidOperationException("تعداد باید مثبت باشد");
                    if (product.Stock < itemDto.Quantity) throw new InvalidOperationException($"موجودی {product.Name} کافی نیست");

                    product.Stock -= itemDto.Quantity;
                    await _agriculturalProductRepository.UpdateAsync(product);

                    newItems.Add(new AgriculturalOrderItem
                    {
                        AgriculturalProductId = product.AgriculturalProductId,
                        Quantity = itemDto.Quantity,
                        Price = userRole == "User" ? product.RetailPrice : product.WholesalePrice
                    });
                }
            }

            // حذف آیتم‌های قدیمی
            foreach (var oldItem in existingItems.Values)
            {
                var product = await _agriculturalProductRepository.GetByIdAsync(oldItem.AgriculturalProductId);
                if (product != null)
                {
                    product.Stock += oldItem.Quantity;
                    await _agriculturalProductRepository.UpdateAsync(product);
                }
                await _agriculturalOrderItemRepository.DeleteAsync(oldItem);
            }

            entity.AgriculturalOrderItems = newItems;

            // محاسبه نهایی قیمت
            entity.TotalPrice = await _priceCalculatorService.CalculateAgriculturalOrder(entity, userRole);

            entity.UpdatedAt = DateTimeOffset.Now;

            await _agriculturalOrderRepository.UpdateAsync(entity);
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
    public async Task<bool> DeleteAsync(string code)
    {
        var entity = await _agriculturalOrderRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        // برگرداندن موجودی محصولات
        var orderItemsResult = await _agriculturalOrderItemRepository.GetPagedAsync(
            filter: i => i.AgriculturalOrderId == entity.AgriculturalOrderId,
            pageNumber: 1,
            pageSize: int.MaxValue);
        var orderItems = orderItemsResult.Items;
        foreach (var item in orderItems)
        {
            var product = await _agriculturalProductRepository.GetByIdAsync(item.AgriculturalProductId);
            if (product != null)
            {
                product.Stock += item.Quantity;
                await _agriculturalProductRepository.UpdateAsync(product);
            }
            await _agriculturalOrderItemRepository.DeleteAsync(item);
        }

        await _agriculturalOrderRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Get By Code
    public async Task<AgriculturalOrderDto?> GetByCodeAsync(string code)
    {
        if (string.IsNullOrEmpty(code))
            throw new ArgumentNullException(nameof(code));

        var entity = await _agriculturalOrderRepository.GetByCodeWithIncludeAsync(
            code: code,
            includes: new Expression<Func<AgriculturalOrder, object>>[] { p => p.AgriculturalOrderItems }
        );


        if (entity == null)
            return null;

        var orderDto = _mapper.Map<AgriculturalOrderDto>(entity);
        orderDto.StatusCode = await _statusRepository.GetCodeByIdAsync(entity.StatusId) ?? string.Empty;
        orderDto.OrderItems = entity.AgriculturalOrderItems.Select(oi => new AgriculturalOrderItemDto
        {
            Code = oi.Code,
            AgriculturalProductCode = _agriculturalProductRepository.GetCodeByIdAsync(oi.AgriculturalProductId).Result ?? string.Empty,
            Quantity = oi.Quantity,
            Price = oi.Price
        }).ToList();
        orderDto.TotalPrice = entity.AgriculturalOrderItems.Sum(oi => oi.Quantity * oi.Price);

        return orderDto;
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<AgriculturalOrderDto>> GetByFilterAsync(AgriculturalOrderFilterDto filter)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "User ID is required from token.");

        var userId = int.Parse(_currentUserService.UserId);
        var userRole = _currentUserService.Roles.FirstOrDefault() ?? "User";

        Expression<Func<AgriculturalOrder, bool>> predicate = o => !o.IsDeleted;

        // فیلتر بر اساس نقش کاربر
        if (userRole != "Manager")
        {
            predicate = predicate.And(o => o.Buyer.UserId == userId);
        }
        else if (!string.IsNullOrEmpty(filter.UserCode))
        {
            predicate = predicate.And(o => o.Buyer.Code == filter.UserCode);
        }

        // فیلترهای دیگر
        if (!string.IsNullOrEmpty(filter.StatusCode))
            predicate = predicate.And(o => o.Status.Code == filter.StatusCode);

        if (!string.IsNullOrEmpty(filter.ProductCode))
            predicate = predicate.And(o => o.AgriculturalOrderItems.Any(i => i.AgriculturalProduct.Code == filter.ProductCode));

        if (filter.MinTotalPrice.HasValue)
            predicate = predicate.And(o => o.TotalPrice >= filter.MinTotalPrice.Value);

        if (filter.MaxTotalPrice.HasValue)
            predicate = predicate.And(o => o.TotalPrice <= filter.MaxTotalPrice.Value);

        if (filter.StartDate.HasValue)
            predicate = predicate.And(o => o.CreatedAt >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            predicate = predicate.And(o => o.CreatedAt <= filter.EndDate.Value);

        return await _agriculturalOrderRepository.GetPagedProjectedAsync(
    filter: predicate,
    selector: o => new AgriculturalOrderDto
    {
        Code = o.Code,
        StatusCode = o.Status.Code,
        BuyerCode = o.Buyer.Code,
        TotalPrice = o.TotalPrice,
        DiscountAmount = o.DiscountAmount,
        IsPaid = o.IsPaid,
        CreatedAt = o.CreatedAt,
        OrderItems = o.AgriculturalOrderItems.Select(i => new AgriculturalOrderItemDto
        {
            Code = i.Code,
            AgriculturalProductCode = i.AgriculturalProduct.Code,
            Quantity = i.Quantity,
            Price = i.Price
        }).ToList()
    },
    includes: new string[] // بهترین روش
    {
        "Status",
        "Buyer",
        "AgriculturalOrderItems.AgriculturalProduct"
    },
    pageNumber: filter.PageNumber,
    pageSize: filter.PageSize,
    orderBy: o => o.CreatedAt,
    orderByDescending: true
);
    }
    #endregion

    #region Change order status
    public async Task<bool> ChangeOrderStatus(string orderCode, OrderAction action)
    {
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var order = await _agriculturalOrderRepository.GetByCodeWithIncludeAsync(
                orderCode,
                o => o.Buyer,
                o => o.AgriculturalOrderItems,
                o => o.Address,  // اضافه شد
                o => o.Status
            );

            if (order == null)
                throw new NotFoundException("سفارش پیدا نشد");
                        
            switch (action)
            {
                case OrderAction.Approve:
                    if (order.Status.StatusId != 1)
                        throw new InvalidOperationException("سفارش در وضعیت در انتظار تأیید نیست");

                    if (order.IsHeld)
                    {
                        await _walletService.DeductAmountAsync(order.HeldAmount);
                        order.IsHeld = false;
                        order.HeldAmount = 0;
                    }

                    order.StatusId = (await _statusRepository.GetByIdAsync(2))?.StatusId
                                     ?? throw new NotFoundException("وضعیت تأیید شده یافت نشد");
                    break;

                case OrderAction.Cancel:
                    if (order.Status.StatusId != 1)
                        throw new InvalidOperationException("سفارش قابل لغو نیست");

                    foreach (var item in order.AgriculturalOrderItems)
                    {
                        var product = await _agriculturalProductRepository.GetByIdAsync(item.AgriculturalProductId);
                        if (product != null)
                        {
                            product.Stock += item.Quantity;
                            await _agriculturalProductRepository.UpdateAsync(product);
                        }
                    }

                    if (order.IsHeld)
                    {
                        await _walletService.ReleaseHoldAsync(order.HeldAmount);
                        order.IsHeld = false;
                        order.HeldAmount = 0;
                    }

                    order.StatusId = (await _statusRepository.GetByIdAsync(5))?.StatusId
                                     ?? throw new NotFoundException("وضعیت لغو شده یافت نشد");
                    break;

                case OrderAction.Sending:
                    order.StatusId = (await _statusRepository.GetByIdAsync(3))?.StatusId
                                     ?? throw new NotFoundException("وضعیت درحال ارسال پیدا نشد");
                    break;

                case OrderAction.Arrival:
                    order.StatusId = (await _statusRepository.GetByIdAsync(4))?.StatusId
                                     ?? throw new NotFoundException("وضعیت رسیدن به مبدا پیدا نشد");
                    break;
            }

            await _agriculturalOrderRepository.UpdateAsync(order);
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

    #region roceed To Payment
    public async Task<PaymentResultDto> ProceedToPaymentAsync(string orderCode)
    {
        var order = await _agriculturalOrderRepository.GetByCodeWithIncludeAsync(
            orderCode,
            o => o.Buyer,
            o => o.AgriculturalOrderItems!,
            o => o.AgriculturalOrderItems!.Select(i => i.AgriculturalProduct),
            o => o.Discount);

        if (order == null) throw new NotFoundException("سفارش پیدا نشد");
        if (order.IsPaid) throw new InvalidOperationException("سفارش قبلاً پرداخت شده است");

        var allowedStatuses = new[] { "3EFC703625", "84F424CD42" };
        if (!allowedStatuses.Contains(order.Status.Code))
            throw new InvalidOperationException($"سفارش در وضعیت {order.Status.Name} قابل پرداخت نیست");

        var amountToPay = order.TotalPrice - order.DiscountAmount;

        // پرداخت با کیف پول
        var hasEnoughBalance = await _walletService.CheckBalanceAsync(amountToPay);

        if (hasEnoughBalance)
        {
            await using var transaction = await _unitOfWork.BeginTransactionAsync();
            try
            {
                await _walletService.DeductAmountAsync(amountToPay);

                order.IsPaid = true;
                order.PaymentDate = DateTimeOffset.UtcNow;
                order.PaymentReference = "WALLET_" + Guid.NewGuid().ToString("N")[..10];

                var paidStatus = await _statusRepository.FirstOrDefaultAsync(s =>
                    s.Code == "PAID" && s.EntityStatus == EntityStatus.AgriculturalOrderStatus);

                order.StatusId = paidStatus!.StatusId;

                await _agriculturalOrderRepository.UpdateAsync(order);
                await _unitOfWork.SaveChangesAsync();
                await transaction.CommitAsync();

                return new PaymentResultDto
                {
                    Success = true,
                    Method = "Wallet",
                    Message = "پرداخت با کیف پول با موفقیت انجام شد"
                };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        else
        {
            // پرداخت آنلاین
            var transactionId = $"ORD_{orderCode}_{DateTimeOffset.Now:yyyyMMddHHmmss}";
            var callbackUrl = $"https://yoursite.com/api/payment/verify?orderCode={orderCode}";

            var paymentUrl = await _paymentGatewayService.InitiatePaymentAsync(
                transactionId, amountToPay, callbackUrl);

            return new PaymentResultDto
            {
                Success = true,
                Method = "Online",
                PaymentUrl = paymentUrl,
                TransactionId = transactionId,
                Message = "در حال انتقال به درگاه پرداخت..."
            };
        }
    }
    #endregion
}