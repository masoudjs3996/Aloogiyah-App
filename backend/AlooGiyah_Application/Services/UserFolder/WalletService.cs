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
    private readonly IGenericRepository<Wallet> _walletRepository;
    private readonly IGenericRepository<WalletTransaction> _walletTransactionRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPaymentGatewayService _paymentGatewayService; // سرویس پرداخت
    private readonly IMapper _mapper;

    public WalletService(
        IGenericRepository<Wallet> walletRepository,
        IGenericRepository<WalletTransaction> walletTransactionRepository,
        ICurrentUserService currentUserService,
        IPaymentGatewayService paymentGatewayService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _walletRepository = walletRepository;
        _walletTransactionRepository = walletTransactionRepository;
        _currentUserService = currentUserService;
        _paymentGatewayService = paymentGatewayService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<WalletDto> GetWalletByUserCodeAsync()
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        var userId =int.Parse(_currentUserService.UserId);

        var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
            throw new NotFoundException("کیف پول پیدا نشد");

        return _mapper.Map<WalletDto>(wallet);
    }

    public async Task<bool> CheckBalanceAsync( decimal requiredAmount)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        var userId = int.Parse(_currentUserService.UserId);

        var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
            throw new NotFoundException("کیف پول پیدا نشد");

        return (wallet.Balance - wallet.HeldAmount) >= requiredAmount;
    }

    public async Task<bool> HoldAmountAsync( decimal amount)
    {

            if (string.IsNullOrEmpty(_currentUserService.UserId))
                throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

            var userId = int.Parse(_currentUserService.UserId);

            var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
            if (wallet == null)
                throw new NotFoundException("کیف پول پیدا نشد");

            if ((wallet.Balance - wallet.HeldAmount) < amount)
                throw new InvalidOperationException("موجودی کافی نیست");

            wallet.HeldAmount += amount;
            await _walletRepository.UpdateAsync(wallet);
            await _unitOfWork.SaveChangesAsync();
            return true;

    }

    public async Task<bool> ReleaseHoldAsync(decimal amount)
    {

            if (string.IsNullOrEmpty(_currentUserService.UserId))
                throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

            var userId = int.Parse(_currentUserService.UserId);

            var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
            if (wallet == null)
                throw new NotFoundException("کیف پول پیدا نشد");

            if (wallet.HeldAmount < amount)
                throw new InvalidOperationException("مبلغ بلوکه‌شده کافی نیست");

            wallet.HeldAmount -= amount;
            await _walletRepository.UpdateAsync(wallet);
            await _unitOfWork.SaveChangesAsync();
            return true;

    }

    public async Task<bool> DeductAmountAsync( decimal amount)
    {
            if (string.IsNullOrEmpty(_currentUserService.UserId))
                throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

            var userId = int.Parse(_currentUserService.UserId);

            var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);
            if (wallet == null)
                throw new NotFoundException("کیف پول پیدا نشد");

            if (wallet.HeldAmount < amount)
                throw new InvalidOperationException("مبلغ بلوکه‌شده کافی نیست");

            wallet.HeldAmount -= amount;
            wallet.Balance -= amount;
            await _walletRepository.UpdateAsync(wallet);
            await _unitOfWork.SaveChangesAsync();
            return true;
        
    }

    public async Task<DepositResultDto> DepositAsync( decimal amount, string? redirectUrl)
    {

        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        var userId = int.Parse(_currentUserService.UserId);

        if (amount <= 0)
            throw new InvalidOperationException("مبلغ شارژ باید مثبت باشد");

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
        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            var walletTransaction = await _walletTransactionRepository.FirstOrDefaultAsync(t => t.ReferenceId == transactionId);
            if (walletTransaction == null)
                throw new NotFoundException("تراکنش پیدا نشد");

            var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.WalletId == walletTransaction.WalletId);
            if (wallet == null)
                throw new NotFoundException("کیف پول پیدا نشد");

            // فرض: درگاه پرداخت تأیید کرده
            var paymentStatus = await _paymentGatewayService.VerifyPaymentAsync(transactionId);
            if (!paymentStatus.IsSuccess)
                throw new InvalidOperationException("پرداخت ناموفق بود");

            // آپدیت موجودی
            wallet.Balance += walletTransaction.Amount;
            await _walletRepository.UpdateAsync(wallet);

            // آپدیت توضیحات تراکنش
            walletTransaction.Description += " - تأیید شد";
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
}