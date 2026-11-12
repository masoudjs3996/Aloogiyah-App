using AlooGiyah_Shared.Constants;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.Data;
namespace AlooGiyah_Application.Services.Store;
public class AgriculturalOrderService : IAgriculturalOrderService
{
    private readonly IAgriculturalOrderQuery _readQuery;

    #region Constructor
    private readonly IGenericRepository<AgriculturalOrder> _orders;
    private readonly IGenericRepository<AlooGiyah_Domain.Entities.Status> _statuses;
    private readonly IGenericRepository<AgriculturalProduct> _products;
    private readonly IGenericRepository<OrderRefund> _refunds;
    private readonly IGenericRepository<SellerReceivable> _sellerReceivables;
    private readonly IGenericRepository<SettlementRates> _settlementRates;
    private readonly IGenericRepository<AlooGiyah_Domain.Entities.UserFolder.Wallet> _wallets;
    private readonly IGenericRepository<AlooGiyah_Domain.Entities.UserFolder.WalletTransaction> _walletTransactions;
    private readonly IGenericRepository<Notification> _notifications;
    private readonly INotificationWriter _notificationWriter;
    private readonly ICurrentUserService _currentUser;
    private readonly ICheckoutService _checkouts;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    public AgriculturalOrderService(IAgriculturalOrderQuery readQuery,
        IGenericRepository<AgriculturalOrder> orders,
        IGenericRepository<AlooGiyah_Domain.Entities.Status> statuses,
        IGenericRepository<AgriculturalProduct> products, IGenericRepository<OrderRefund> refunds,
        ICurrentUserService currentUser, ICheckoutService checkouts, IUnitOfWork unitOfWork, IMapper mapper,
        IGenericRepository<AlooGiyah_Domain.Entities.UserFolder.Wallet> wallets,
        IGenericRepository<AlooGiyah_Domain.Entities.UserFolder.WalletTransaction> walletTransactions,
        IGenericRepository<Notification> notifications, INotificationWriter notificationWriter,
        IGenericRepository<SellerReceivable> sellerReceivables, IGenericRepository<SettlementRates> settlementRates)
    {
        _readQuery = readQuery;
        _orders = orders; _statuses = statuses; _products = products; _refunds = refunds;
        _wallets = wallets; _walletTransactions = walletTransactions;
        _notifications = notifications;
        _notificationWriter = notificationWriter;
        _sellerReceivables = sellerReceivables;
        _settlementRates = settlementRates;
        _currentUser = currentUser; _checkouts = checkouts; _unitOfWork = unitOfWork; _mapper = mapper;
    }
    #endregion
    private int UserId()
    {
        if (!_currentUser.IsAuthenticated || _currentUser.IsGuest || !int.TryParse(_currentUser.UserId, out var id))
            throw new UnauthorizedException("ابتدا وارد حساب کاربری شوید.");
        return id;
    }
    private bool IsManager => _currentUser.Roles.Contains("Manager") || _currentUser.Roles.Contains("Admin");
    private IQueryable<AgriculturalOrder> Query() => _orders.GetAll()
        .Include(x => x.Status).Include(x => x.Buyer).Include(x => x.Farm).ThenInclude(x => x!.Owner).Include(x => x.Checkout)
        .Include(x => x.Checkout).ThenInclude(x => x!.Payments)
        .Include(x => x.Checkout).ThenInclude(x => x!.Orders).ThenInclude(x => x.Status)
        .Include(x => x.Checkout).ThenInclude(x => x!.DeliveryBooking)
        .Include(x => x.Refund).Include(x => x.History).Include(x => x.AgriculturalOrderItems).ThenInclude(x => x.AgriculturalProduct);
    private bool CanRead(AgriculturalOrder order, int id) => order.BuyerId == id || IsManager ||
        ((order.IsPaid || order.IsHeld || order.Checkout?.IsSubmitted == true) && order.Farm?.OwnerId == id);
    private AgriculturalOrderDto Map(AgriculturalOrder order, int id)
    {
        var dto = _mapper.Map<AgriculturalOrderDto>(order);
        dto.AllowedActions = AgriculturalOrderPolicy.AllowedActions(order, id, IsManager);
        dto.SellerCode = order.Farm?.Owner?.Code;
        dto.History = dto.History.OrderBy(x => x.CreatedAt).ToList();
        return dto;
    }
    #region Closed Legacy Mutations
    public Task<AgriculturalOrderDto> CreateAsync(AgriculturalOrderCreateDto dto) =>
        throw new BadRequestException("ثبت خرید فقط از سبد و Checkout انجام می‌شود.");
    public Task<bool> UpdateAsync(AgriculturalOrderUpdateDto dto) =>
        throw new BadRequestException("آیتم، قیمت و آدرس سفارش قابل ویرایش نیست؛ سبد خرید را تغییر دهید.");
    public Task<bool> DeleteAsync(string code) =>
        throw new BadRequestException("سفارش قابل حذف نیست.");
    public Task<bool> ChangeOrderStatus(string code, OrderAction action) =>
        throw new BadRequestException("از endpoint عملیات سفارش استفاده کنید.");
    public Task<PaymentResultDto> ProceedToPaymentAsync(string code) =>
        throw new BadRequestException("پرداخت با کد Checkout انجام می‌شود.");
    public Task<CheckoutDto> CreateFromCartAsync(CheckoutFromCartDto dto) => _checkouts.CreateFromCartAsync(dto);
    #endregion
    #region Read
    public async Task<AgriculturalOrderDto?> GetByCodeAsync(string code)
    {
        return await _readQuery.GetByCodeAsync(code);
    }
    public async Task<PagedResult<AgriculturalOrderDto>> GetByFilterAsync(AgriculturalOrderFilterDto filter)
    {
        return await _readQuery.GetByFilterAsync(filter);
    }
    #endregion
    #region Execute Action
    public async Task<AgriculturalOrderDto> ExecuteActionAsync(string code, OrderActionDto dto)
    {
        var id = UserId();
        if (dto.Action == null || !Enum.IsDefined(dto.Action.Value)) throw new BadRequestException("عملیات نامعتبر است.");
        await using var tx = await _unitOfWork.BeginTransactionAsync(IsolationLevel.Serializable);
        var order = await Query().SingleOrDefaultAsync(x => x.Code == code);
        if (order == null || !CanRead(order, id)) throw new NotFoundException("سفارش یافت نشد.");
        var action = dto.Action.Value;
        if (!AgriculturalOrderPolicy.AllowedActions(order, id, IsManager).Contains(action.ToString()))
            throw new ForbiddenException("این عملیات برای شما یا وضعیت فعلی سفارش مجاز نیست.");
        if (action != AgriculturalOrderAction.Reject &&
            !order.AgriculturalOrderItems.Any(item => !item.IsDeleted && item.Quantity > 0))
            throw new ConflictException("سفارش قلم فعالی ندارد. وضعیت سفارش را بررسی کنید.");
        if (action == AgriculturalOrderAction.Reject && string.IsNullOrWhiteSpace(dto.Reason))
            throw new BadRequestException("دلیل رد سفارش الزامی است.");
        if (action == AgriculturalOrderAction.Ship && string.IsNullOrWhiteSpace(dto.ShippingMethod))
            throw new BadRequestException("روش ارسال الزامی است.");
        if (action == AgriculturalOrderAction.ConfirmDelivery && order.BuyerId != id && string.IsNullOrWhiteSpace(dto.Reason))
            throw new BadRequestException("برای ثبت تحویل توسط مدیریت، توضیح الزامی است.");
        var target = AgriculturalOrderPolicy.Target(action);
        var status = await _statuses.GetAll().SingleOrDefaultAsync(x => x.Code == target && x.EntityStatus == EntityStatus.AgriculturalOrderStatus)
            ?? throw new NotFoundException("وضعیت سفارش در دیتابیس یافت نشد.");
        var previous = order.Status.Code;
        if (action == AgriculturalOrderAction.Approve)
        {
            await CaptureHeldFundsAsync(order);
            await ReserveSellerIncomeAsync(order);
        }
        if (action == AgriculturalOrderAction.Reject && order.IsHeld) await ReleaseHeldFundsAsync(order);
        if (action == AgriculturalOrderAction.Reject)
        {
            order.RejectionReason = dto.Reason!.Trim();
            if (order.InventoryReserved)
            {
                foreach (var item in order.AgriculturalOrderItems.OrderBy(x => x.AgriculturalProductId))
                {
                    // Include soft-deleted products: restoration must not lose reserved stock.
                    var product = await _products.GetAllIncludingDeleted().SingleOrDefaultAsync(x => x.AgriculturalProductId == item.AgriculturalProductId)
                        ?? throw new ConflictException("محصول رزروشده در دسترس نیست؛ بررسی مدیریت لازم است.");
                    product.Stock = checked(product.Stock + item.Quantity);
                }
                order.InventoryReserved = false;
            }
            if (order.IsPaid)
            {
            var payment = order.Checkout!.Payments.SingleOrDefault();
            if (payment == null) throw new ConflictException("تراکنش پرداخت سفارش یافت نشد.");
            var walletRefund = payment.Method is "Wallet" or "Free";
            var reference = "REFUND_" + order.Code;
            if (walletRefund && order.TotalPrice > 0)
            {
                // Credit the BUYER's wallet, never the current farmer's wallet.
                var wallet = await _wallets.GetAll().SingleOrDefaultAsync(x => x.UserId == order.BuyerId)
                    ?? throw new ConflictException("کیف پول خریدار یافت نشد.");
                wallet.Balance += order.TotalPrice;
                await _walletTransactions.AddAsync(new AlooGiyah_Domain.Entities.UserFolder.WalletTransaction {
                    WalletId = wallet.WalletId, Amount = order.TotalPrice, TransactionType = WalletTransactionType.Deposit,
                    ReferenceId = reference, CompletedAt = DateTimeOffset.UtcNow, Description = "بازپرداخت سفارش " + order.Code });
            }
            order.Refund = new OrderRefund { Amount = order.TotalPrice, Reason = order.RejectionReason,
                Status = walletRefund ? "Completed" : "Pending", Reference = walletRefund ? reference : null,
                CompletedById = walletRefund ? id : null, CompletedAt = walletRefund ? DateTimeOffset.UtcNow : null };
            }
        }
        if (action == AgriculturalOrderAction.Ship)
        {
            order.ShippingMethod = dto.ShippingMethod!.Trim(); order.TrackingCode = dto.TrackingCode?.Trim();
            order.ShippedAt = DateTimeOffset.UtcNow;
            order.InventoryReserved = false; // Reserved stock now leaves the store.
        }
        if (action == AgriculturalOrderAction.ConfirmDelivery)
        {
            var income = await _sellerReceivables.GetAll().SingleOrDefaultAsync(x => x.AgriculturalOrderId == order.AgriculturalOrderId);
            // Historical paid orders require reconciliation before creating withdrawable income.
            if (income != null && income.ReleasedAt == null)
            {
                income.ReleasedAmount = income.NetAmount;
                income.ReleasedAt = DateTimeOffset.UtcNow;
                income.Version = Guid.NewGuid();
            }
            order.DeliveredAt = DateTimeOffset.UtcNow; order.DeliveredById = id;
        }
        order.History.Add(new AgriculturalOrderHistory { ActorId = id, Action = action.ToString(),
            FromStatusCode = previous, ToStatusCode = target, Reason = dto.Reason?.Trim() });
        order.StatusId = status.StatusId; order.Status = status;
        order.Version = Guid.NewGuid(); order.UpdatedAt = DateTimeOffset.UtcNow;
        if (action == AgriculturalOrderAction.Reject) await ReleaseRejectedDelivery(order);
        switch (action)
        {
            case AgriculturalOrderAction.Approve:
                await _notificationWriter.AddForUserAsync(order.BuyerId, NotificationTypes.OrderPaid,
                    $"پرداخت سفارش {order.Code} تأیید شد و سفارش برای آماده‌سازی به مزرعه ارسال شد.");
                break;
            case AgriculturalOrderAction.Reject:
                var refundNotice = order.Refund?.Status == "Completed"
                    ? " مبلغ سفارش به کیف پول شما برگشت داده شد."
                    : order.Refund?.Status == "Pending"
                        ? " بازپرداخت سفارش در انتظار انجام است."
                        : string.Empty;
                await _notificationWriter.AddForUserAsync(order.BuyerId, NotificationTypes.OrderRejected,
                    $"سفارش {order.Code} رد شد. {order.RejectionReason}{refundNotice}");
                break;
            case AgriculturalOrderAction.Ship:
                var shippingDetails = string.IsNullOrWhiteSpace(order.TrackingCode)
                    ? $" روش ارسال: {order.ShippingMethod}."
                    : $" روش ارسال: {order.ShippingMethod}، کد رهگیری: {order.TrackingCode}.";
                await _notificationWriter.AddForUserAsync(order.BuyerId, NotificationTypes.OrderShipped,
                    $"سفارش {order.Code} به سمت میدان بار ارسال شد؛ پس از ورود به میدان، زمان تحویل اطلاع داده می‌شود.{shippingDetails}");
                break;
            case AgriculturalOrderAction.ConfirmDelivery when order.Farm != null:
                var beneficiary = await _sellerReceivables.GetAll().Where(x => x.AgriculturalOrderId == order.AgriculturalOrderId)
                    .Select(x => (int?)x.SellerId).SingleOrDefaultAsync() ?? order.Farm.OwnerId;
                await _notificationWriter.AddForUserAsync(beneficiary, NotificationTypes.OrderDelivered,
                    $"تحویل سفارش {order.Code} توسط خریدار تأیید شد.");
                break;
        }
        await _unitOfWork.SaveChangesAsync(); await tx.CommitAsync();
        return Map(order, id);
    }
    #endregion
    #region Manual External Refund Confirmation
    // Does not transfer money. Manager records a refund only after an actual external transfer.
    public async Task<AgriculturalOrderDto> CompleteRefundAsync(string code, CompleteRefundDto dto)
    {
        var id = UserId(); if (!IsManager) throw new ForbiddenException("فقط مدیریت مجاز است.");
        if (string.IsNullOrWhiteSpace(dto.Reference)) throw new BadRequestException("شناسه انتقال وجه الزامی است.");
        await using var tx = await _unitOfWork.BeginTransactionAsync(IsolationLevel.Serializable);
        var order = await Query().SingleOrDefaultAsync(x => x.Code == code) ?? throw new NotFoundException("سفارش یافت نشد.");
        var refund = order.Refund ?? throw new BadRequestException("درخواست بازپرداخت وجود ندارد.");
        if (refund.Status == "Completed")
        {
            if (refund.Reference != dto.Reference.Trim()) throw new ConflictException("بازپرداخت قبلاً ثبت شده است.");
            return Map(order, id);
        }
        if (await _refunds.GetAll().AnyAsync(x => x.Reference == dto.Reference.Trim() && x.OrderRefundId != refund.OrderRefundId))
            throw new ConflictException("شناسه بازپرداخت قبلاً استفاده شده است.");
        refund.Status = "Completed"; refund.Reference = dto.Reference.Trim(); refund.CompletedAt = DateTimeOffset.UtcNow;
        refund.CompletedById = id; refund.Version = Guid.NewGuid();
        order.History.Add(new AgriculturalOrderHistory { ActorId = id, Action = "CompleteRefund",
            FromStatusCode = order.Status.Code, ToStatusCode = order.Status.Code, Reason = dto.Reference.Trim() });
        order.Version = Guid.NewGuid();
        await _notificationWriter.AddForUserAsync(order.BuyerId, NotificationTypes.OrderRefunded,
            $"بازپرداخت سفارش {order.Code} انجام شد.");
        await _unitOfWork.SaveChangesAsync(); await tx.CommitAsync(); return Map(order, id);
    }
    #endregion

    private async Task ReserveSellerIncomeAsync(AgriculturalOrder order)
    {
        if (await _sellerReceivables.GetAllIncludingDeleted().AnyAsync(x => x.AgriculturalOrderId == order.AgriculturalOrderId)) return;
        if (order.Farm == null || !order.IsPaid || order.TotalPrice < 0)
            throw new ConflictException("اطلاعات درآمد فروشنده معتبر نیست.");
        var rates = await _settlementRates.GetAll().OrderByDescending(x => x.SettlementRatesId).FirstOrDefaultAsync();
        var commissionRate = rates?.CommissionRate ?? 0;
        var taxRate = rates?.TaxRate ?? 0;
        var gross = DiscountFunding.SellerGross(order);
        var commission = decimal.Round(gross * commissionRate / 100m, 2);
        var tax = Math.Min(gross - commission, decimal.Round(gross * taxRate / 100m, 2));
        await _sellerReceivables.AddAsync(new SellerReceivable {
            AgriculturalOrderId = order.AgriculturalOrderId, SellerId = order.Farm.OwnerId,
            GrossAmount = gross, PlatformDiscountAmount = order.PlatformDiscountAmount,
            SellerDiscountAmount = order.SellerDiscountAmount, CommissionRate = commissionRate,
            CommissionAmount = commission, TaxRate = taxRate, TaxAmount = tax,
            NetAmount = gross - commission - tax });
    }
    private async Task ReleaseRejectedDelivery(AgriculturalOrder order)
    {
        if (order.Checkout?.DeliveryBooking?.HeldDeliveryFee is not > 0) return;
        var wallet = await _wallets.GetAll().SingleOrDefaultAsync(w => w.UserId == order.BuyerId)
            ?? throw new ConflictException("کیف پول خریدار یافت نشد.");
        await DeferredDeliveryFunds.ReleaseIfRejected(order.Checkout.DeliveryBooking, wallet, _walletTransactions);
    }
    private async Task CaptureHeldFundsAsync(AgriculturalOrder order)
    {
        if (order.IsPaid) return; // Historical immediate payments remain valid.
        if (!order.IsHeld || order.HeldAmount != order.TotalPrice || order.TotalPrice < 0)
            throw new ConflictException("رزرو وجه سفارش معتبر نیست.");
        if (order.TotalPrice > 0)
        {
            var wallet = await _wallets.GetAll().SingleOrDefaultAsync(x => x.UserId == order.BuyerId)
                ?? throw new ConflictException("کیف پول خریدار یافت نشد.");
            if (wallet.HeldAmount < order.TotalPrice || wallet.Balance < order.TotalPrice)
                throw new ConflictException("موجودی رزروشده کافی نیست.");
            wallet.Balance -= order.TotalPrice; wallet.HeldAmount -= order.TotalPrice;
            await _walletTransactions.AddAsync(new AlooGiyah_Domain.Entities.UserFolder.WalletTransaction {
                WalletId = wallet.WalletId, Amount = order.TotalPrice, TransactionType = WalletTransactionType.Withdrawal,
                ReferenceId = "CAPTURE_" + order.Code, Description = "برداشت وجه پس از تأیید مزرعه " + order.Code });
        }
        order.IsHeld = false; order.HeldAmount = 0; order.IsPaid = true;
        order.PaymentReference = "CAPTURE_" + order.Code; order.PaymentDate = DateTimeOffset.UtcNow;
        order.Checkout!.IsPaid = order.Checkout.Orders.All(x => x.IsPaid);
        order.Checkout.Version = Guid.NewGuid();
    }
    private async Task ReleaseHeldFundsAsync(AgriculturalOrder order)
    {
        if (!order.IsHeld) return;
        if (order.IsPaid || order.HeldAmount != order.TotalPrice || order.TotalPrice < 0)
            throw new ConflictException("رزرو وجه سفارش معتبر نیست.");
        if (order.HeldAmount > 0)
        {
            var wallet = await _wallets.GetAll().SingleOrDefaultAsync(x => x.UserId == order.BuyerId)
                ?? throw new ConflictException("کیف پول خریدار یافت نشد.");
            if (wallet.HeldAmount < order.HeldAmount) throw new ConflictException("موجودی رزروشده کافی نیست.");
            wallet.HeldAmount -= order.HeldAmount;
            await _walletTransactions.AddAsync(new AlooGiyah_Domain.Entities.UserFolder.WalletTransaction {
                WalletId = wallet.WalletId, Amount = order.HeldAmount, TransactionType = WalletTransactionType.Release,
                ReferenceId = "RELEASE_" + order.Code, Description = "آزادسازی رزرو سفارش " + order.Code });
        }
        order.IsHeld = false; order.HeldAmount = 0;
        order.Checkout!.Version = Guid.NewGuid();
    }
    public async Task ExpireApprovalDueAsync()
    {
        var now = DateTimeOffset.UtcNow;
        var codes = await _orders.GetAll().AsNoTracking().Where(x => x.IsHeld && !x.IsPaid &&
            x.ApprovalExpiresAt <= now && x.Status.Code == AlooGiyah_Shared.Constants.AgriculturalOrderStatuses.CheckingInventory)
            .OrderBy(x => x.ApprovalExpiresAt).Take(100).Select(x => x.Code).ToListAsync();
        foreach (var code in codes)
        {
            await using var tx = await _unitOfWork.BeginTransactionAsync(IsolationLevel.Serializable);
            var order = await Query().SingleOrDefaultAsync(x => x.Code == code);
            if (order != null && order.IsHeld && !order.IsPaid && order.ApprovalExpiresAt <= DateTimeOffset.UtcNow &&
                order.Status.Code == AlooGiyah_Shared.Constants.AgriculturalOrderStatuses.CheckingInventory)
            {
                var status = await _statuses.GetAll().SingleOrDefaultAsync(x =>
                    x.Code == AlooGiyah_Shared.Constants.AgriculturalOrderStatuses.Rejected && x.EntityStatus == EntityStatus.AgriculturalOrderStatus)
                    ?? throw new NotFoundException("وضعیت سفارش در دیتابیس یافت نشد.");
                await ReleaseHeldFundsAsync(order);
                if (order.InventoryReserved)
                {
                    foreach (var item in order.AgriculturalOrderItems.OrderBy(x => x.AgriculturalProductId))
                    {
                        var product = await _products.GetAllIncludingDeleted().SingleOrDefaultAsync(x => x.AgriculturalProductId == item.AgriculturalProductId)
                            ?? throw new ConflictException("محصول رزروشده یافت نشد.");
                        product.Stock = checked(product.Stock + item.Quantity);
                    }
                    order.InventoryReserved = false;
                }
                order.RejectionReason = "مهلت تأیید مزرعه تمام شد.";
                order.History.Add(new AgriculturalOrderHistory { Action = "ApprovalExpired", FromStatusCode = order.Status.Code,
                    ToStatusCode = status.Code, Reason = order.RejectionReason });
                order.Status = status; order.StatusId = status.StatusId; order.Version = Guid.NewGuid(); order.UpdatedAt = DateTimeOffset.UtcNow;
                await ReleaseRejectedDelivery(order);
                await _notificationWriter.AddForUserAsync(order.BuyerId, NotificationTypes.OrderExpired,
                    $"مهلت تأیید سفارش {order.Code} تمام شد و مبلغ رزروشده آزاد شد.");
                await _unitOfWork.SaveChangesAsync();
            }
            await tx.CommitAsync();
        }
    }

    public async Task NotifyDeliveryRemindersAsync()
    {
        var reminderType = NotificationTypes.OrderDeliveryReminder;
        var cutoff = DateTimeOffset.UtcNow.AddHours(-24);
        var orders = await _orders.GetAll().AsNoTracking()
            .Where(x => x.Status.Code == AlooGiyah_Shared.Constants.AgriculturalOrderStatuses.Shipped &&
                        x.ShippedAt.HasValue && x.ShippedAt <= cutoff)
            .Select(x => new { x.Code, x.BuyerId })
            .Take(200)
            .ToListAsync();

        foreach (var order in orders)
        {
            var message = $"پس از بررسی اقلام سفارش {order.Code}، کد تحویل را از جزئیات تحویل به نماینده شرکت بدهید.";
            if (await _notifications.GetAll().AnyAsync(x => (x.Type == reminderType || x.Type == "OrderDeliveryReminder") && x.UserId == order.BuyerId && x.Message == message))
                continue;
            await _notificationWriter.AddForUserAsync(order.BuyerId, reminderType, message);
        }

        if (orders.Count > 0)
            await _unitOfWork.SaveChangesAsync();
    }
}
