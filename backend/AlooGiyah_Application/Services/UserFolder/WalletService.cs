using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.Wallet;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;

namespace AlooGiyah_Application.Services.UserFolder;

public class WalletService : IWalletService
{
    private readonly IWalletQuery _readQuery;

    private readonly IGenericRepository<Wallet> _walletRepository;
    private readonly IGenericRepository<WalletTransaction> _walletTransactionRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPaymentGatewayService _paymentGatewayService; // سرویس پرداخت
    private readonly IMapper _mapper;

    public WalletService(IWalletQuery readQuery,
        
        IGenericRepository<Wallet> walletRepository,
        IGenericRepository<WalletTransaction> walletTransactionRepository,
        ICurrentUserService currentUserService,
        IPaymentGatewayService paymentGatewayService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _readQuery = readQuery;
        _walletRepository = walletRepository;
        _walletTransactionRepository = walletTransactionRepository;
        _currentUserService = currentUserService;
        _paymentGatewayService = paymentGatewayService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<WalletDto> GetWalletByUserCodeAsync()
    {
        return await _readQuery.GetWalletByUserCodeAsync() ?? throw new NotFoundException("کیف پول پیدا نشد.");
    }

    public async Task<bool> CheckBalanceAsync( decimal requiredAmount)
    {
        if (requiredAmount <= 0) throw new BadRequestException("مبلغ باید مثبت باشد.");
        var userId = CurrentUserId();

        var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
            throw new NotFoundException("کیف پول پیدا نشد");

        return (wallet.Balance - wallet.HeldAmount) >= requiredAmount;
    }

    public async Task<bool> HoldAmountAsync( decimal amount)
    {
        if (amount <= 0) throw new BadRequestException("مبلغ باید مثبت باشد.");
        ValidateWalletAmount(amount);
        await using var transaction = await _unitOfWork.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

            var userId = CurrentUserId();

            var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
            if (wallet == null)
                throw new NotFoundException("کیف پول پیدا نشد");

            if ((wallet.Balance - wallet.HeldAmount) < amount)
                throw new InvalidOperationException("موجودی کافی نیست");

            wallet.HeldAmount += amount;
            await _walletRepository.UpdateAsync(wallet);
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;

    }

    public async Task<bool> ReleaseHoldAsync(decimal amount)
    {
        if (amount <= 0) throw new BadRequestException("مبلغ باید مثبت باشد.");
        ValidateWalletAmount(amount);
        await using var transaction = await _unitOfWork.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

            var userId = CurrentUserId();

            var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
            if (wallet == null)
                throw new NotFoundException("کیف پول پیدا نشد");

            if (wallet.HeldAmount < amount)
                throw new InvalidOperationException("مبلغ بلوکه‌شده کافی نیست");

            wallet.HeldAmount -= amount;
            await _walletRepository.UpdateAsync(wallet);
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;

    }

    public async Task<bool> DeductAmountAsync( decimal amount)
    {
        if (amount <= 0) throw new BadRequestException("مبلغ باید مثبت باشد.");
        ValidateWalletAmount(amount);
        await using var transaction = await _unitOfWork.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            var userId = CurrentUserId();

            var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
            if (wallet == null)
                throw new NotFoundException("کیف پول پیدا نشد");

            if (wallet.HeldAmount < amount || wallet.Balance < amount)
                throw new InvalidOperationException("مبلغ بلوکه‌شده کافی نیست");

            wallet.HeldAmount -= amount;
            wallet.Balance -= amount;
            await _walletRepository.UpdateAsync(wallet);
            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        
    }

    public async Task<DepositResultDto> DepositAsync( decimal amount, string? redirectUrl)
    {

        var userId = CurrentUserId();

        ValidateWalletAmount(amount);
        if (amount < 1000 || amount > 1000000000)
            throw new BadRequestException("مبلغ شارژ باید بین ۱٬۰۰۰ تا ۱٬۰۰۰٬۰۰۰٬۰۰۰ تومان باشد.");

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
            if (wallet == null)
                throw new NotFoundException("کیف پول پیدا نشد");

            // ایجاد تراکنش پرداخت در درگاه
            var transactionId = Guid.NewGuid().ToString();
            var paymentUrl = await _paymentGatewayService.InitiatePaymentAsync(
                transactionId, amount, redirectUrl);

            // ثبت تراکنش در WalletTransaction (وضعیت: در انتظار)
            var walletTransaction = new WalletTransaction
            {
                WalletId = wallet.WalletId,
                Amount = amount,
                TransactionType = WalletTransactionType.Deposit,
                ReferenceId = transactionId,
                Description = $"شارژ کیف پول - مبلغ: {amount}"
            };
            await _walletTransactionRepository.AddAsync(walletTransaction);

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            return new DepositResultDto
            {
                TransactionId = transactionId,
                PaymentUrl = paymentUrl,
                NewBalance = wallet.Balance // موجودی فعلی، بعداً آپدیت می‌شه
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // متد برای تأیید پرداخت موفق (بعد از بازگشت از درگاه)
    public async Task<bool> ConfirmDepositAsync(string transactionId)
    {
        if (string.IsNullOrWhiteSpace(transactionId) || transactionId.Length > 150)
            throw new BadRequestException("شناسه تراکنش معتبر نیست.");
        await using var transaction = await _unitOfWork.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        try
        {
            var walletTransaction = await _walletTransactionRepository.FirstOrDefaultAsync(t => t.ReferenceId == transactionId);
            if (walletTransaction == null)
                throw new NotFoundException("تراکنش پیدا نشد");
            if (walletTransaction.TransactionType != WalletTransactionType.Deposit || walletTransaction.Amount <= 0)
                throw new BadRequestException("تراکنش شارژ معتبر نیست.");
            if (walletTransaction.CompletedAt.HasValue) return true;

            var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.WalletId == walletTransaction.WalletId);
            if (wallet == null)
                throw new NotFoundException("کیف پول پیدا نشد");

            // فرض: درگاه پرداخت تأیید کرده
            var paymentStatus = await _paymentGatewayService.VerifyPaymentAsync(transactionId, walletTransaction.Amount);
            if (!paymentStatus.IsSuccess)
                throw new BadRequestException("پرداخت توسط ارائه‌دهنده تأیید نشد.");
            if (paymentStatus.VerifiedAmountToman != walletTransaction.Amount || paymentStatus.Currency != "IRT" ||
                string.IsNullOrWhiteSpace(paymentStatus.ProviderReference) || paymentStatus.ProviderReference.Length > 150 ||
                string.IsNullOrWhiteSpace(paymentStatus.ProviderName) || paymentStatus.ProviderName.Length > 30)
                throw new ConflictException("مبلغ، واحد پول یا شناسه تأیید پرداخت معتبر نیست.");
            walletTransaction.PaymentProvider = paymentStatus.ProviderName;
            walletTransaction.ProviderReference = paymentStatus.ProviderReference;

            // آپدیت موجودی
            wallet.Balance += walletTransaction.Amount;
            await _walletRepository.UpdateAsync(wallet);

            // آپدیت توضیحات تراکنش
            walletTransaction.Description += " - تأیید شد";
            walletTransaction.CompletedAt = DateTimeOffset.UtcNow;
            await _walletTransactionRepository.UpdateAsync(walletTransaction);

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

    private int CurrentUserId()
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.IsGuest ||
            !int.TryParse(_currentUserService.UserId, out var id) || id <= 0)
            throw new UnauthorizedException("ابتدا وارد حساب کاربری شوید.");
        return id;
    }

    private static void ValidateWalletAmount(decimal amount)
    {
        if (amount <= 0 || amount >= 1000000000000000000m || decimal.Round(amount, 2) != amount)
            throw new BadRequestException("مبلغ باید مثبت و حداکثر با دو رقم اعشار باشد.");
    }
}
