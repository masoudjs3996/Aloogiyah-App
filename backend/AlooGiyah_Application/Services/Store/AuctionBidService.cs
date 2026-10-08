using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.Auction;
using AlooGiyah_Application.DTOs.AuctionBid;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System.Linq.Expressions;
using System.Data;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Application.Services.Store;

public class AuctionBidService : IAuctionBidService
{
    private readonly IAuctionBidQuery _readQuery;

    #region Constructor
    private readonly IGenericRepository<AuctionBid> _auctionBidRepository;
    private readonly IGenericRepository<Auction> _auctionRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AuctionBidService(IAuctionBidQuery readQuery,
        
        IGenericRepository<AuctionBid> auctionBidRepository,
        IGenericRepository<Auction> auctionRepository,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _readQuery = readQuery;
        _auctionBidRepository = auctionBidRepository;
        _auctionRepository = auctionRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion


    #region Create
    public async Task<AuctionBidDto> CreateAsync(AuctionBidCreateDto dto)
    {
        var userId = CurrentUserId();
        if (dto.BidAmount <= 0) throw new BadRequestException("مبلغ پیشنهاد باید بیشتر از صفر باشد.");
        await using var tx = await _unitOfWork.BeginTransactionAsync(IsolationLevel.Serializable);
        var auction = await _auctionRepository.GetAll()
            .Include(x => x.AgriculturalProduct).ThenInclude(x => x.Farm)
            .SingleOrDefaultAsync(x => x.Code == dto.auctionCode);
        if (auction == null)
            throw new NotFoundException($"حراج با کد {dto.auctionCode} پیدا نشد");
        var now = DateTimeOffset.UtcNow;
        if (auction.StartDate > now || auction.EndDate <= now || auction.WinnerId != null)
            throw new BadRequestException("حراج در حال حاضر فعال نیست.");
        if (auction.AgriculturalProduct.Farm.OwnerId == userId)
            throw new ForbiddenException("مالک محصول نمی‌تواند در حراج خودش پیشنهاد ثبت کند.");
        var currentPrice = await _auctionBidRepository.GetAll().Where(b => b.AuctionId == auction.AuctionId)
            .Select(b => (decimal?)b.BidAmount).MaxAsync();
        var minimum = currentPrice ?? auction.StartingPrice;
        if (dto.BidAmount <= minimum)
            throw new BadRequestException($"مبلغ پیشنهادی باید بیشتر از قیمت جاری ({minimum}) باشد.");

        var entity = _mapper.Map<AuctionBid>(dto);
        entity.AuctionId = auction.AuctionId;
        entity.UserId = userId;

        await _auctionBidRepository.AddAsync(entity);

        // به‌روزرسانی قیمت جاری حراج
        auction.CurrentPrice = dto.BidAmount;
        await _auctionRepository.UpdateAsync(auction);

        await _unitOfWork.SaveChangesAsync();
        await tx.CommitAsync();

        var bidDto = _mapper.Map<AuctionBidDto>(entity);

        return bidDto;
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(AuctionBidUpdateDto dto)
    {
        CurrentUserId();
        throw new BadRequestException("پیشنهاد ثبت‌شده قابل ویرایش نیست؛ پیشنهاد جدید ثبت کنید.");
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        CurrentUserId();
        if (!IsManager) throw new ForbiddenException("حذف پیشنهاد فقط برای مدیریت مجاز است.");
        await using var tx = await _unitOfWork.BeginTransactionAsync(IsolationLevel.Serializable);
        var entity = await _auctionBidRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        var auction = await _auctionRepository.GetByIdAsync(entity.AuctionId);
        if (auction == null)
            throw new NotFoundException("حراج مرتبط پیدا نشد");

        if (auction.WinnerId != null)
            throw new BadRequestException("پس از نهایی‌شدن حراج، پیشنهاد قابل حذف نیست.");
        await _auctionBidRepository.DeleteAsync(entity);
        auction.CurrentPrice = await _auctionBidRepository.GetAll()
            .Where(b => b.AuctionId == auction.AuctionId && b.AuctionBidId != entity.AuctionBidId)
            .Select(b => (decimal?)b.BidAmount).MaxAsync();
        await _auctionRepository.UpdateAsync(auction);

        await _unitOfWork.SaveChangesAsync();
        await tx.CommitAsync();
        return true;
    }

    private int CurrentUserId()
    {
        if (!_currentUserService.IsAuthenticated || _currentUserService.IsGuest ||
            !int.TryParse(_currentUserService.UserId, out var id))
            throw new AlooGiyah_Shared.Exceptions.UnauthorizedException("ابتدا وارد حساب کاربری شوید.");
        return id;
    }

    private bool IsManager => _currentUserService.Roles.Contains("Manager") || _currentUserService.Roles.Contains("Admin");
    #endregion

    #region Get By Code
    public async Task<AuctionBidDto?> GetByCodeAsync(string code)
    {
        return await _readQuery.GetByCodeAsync(code);
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<AuctionBidDto>> GetByFilterAsync(AuctionBidFilterDto filter)
    {
        return await _readQuery.GetByFilterAsync(filter);
    }
    #endregion
}
