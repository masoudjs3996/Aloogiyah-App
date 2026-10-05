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
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        // اعتبارسنجی حراج
        var auction = await _auctionRepository.GetByCodeAsync(dto.auctionCode);
        if (auction == null)
            throw new NotFoundException($"حراج با کد {dto.auctionCode} پیدا نشد");

        // چک کردن اینکه حراج فعال است
        if (auction.StartDate > DateTime.UtcNow || auction.EndDate < DateTime.UtcNow)
            throw new InvalidOperationException("حراج در حال حاضر فعال نیست");

        // اعتبارسنجی کاربر
        var userId = int.Parse(_currentUserService.UserId);

        // اعتبارسنجی مبلغ پیشنهادی
        if (dto.BidAmount <= auction.StartingPrice)
            throw new InvalidOperationException($"مبلغ پیشنهادی باید بیشتر از قیمت اولیه ({auction.StartingPrice}) باشد");

        if (auction.CurrentPrice.HasValue && dto.BidAmount <= auction.CurrentPrice.Value)
            throw new InvalidOperationException($"مبلغ پیشنهادی باید بیشتر از قیمت جاری ({auction.CurrentPrice.Value}) باشد");

        var entity = _mapper.Map<AuctionBid>(dto);
        entity.AuctionId = auction.AuctionId;
        entity.UserId = userId;

        await _auctionBidRepository.AddAsync(entity);

        // به‌روزرسانی قیمت جاری حراج
        auction.CurrentPrice = dto.BidAmount;
        await _auctionRepository.UpdateAsync(auction);

        await _unitOfWork.SaveChangesAsync();

        var bidDto = _mapper.Map<AuctionBidDto>(entity);

        return bidDto;
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(AuctionBidUpdateDto dto)
    {
        var entity = await _auctionBidRepository.GetByCodeAsync(dto.Code);
        if (entity == null)
            return false;

        var auction = await _auctionRepository.GetByIdAsync(entity.AuctionId);
        if (auction == null)
            throw new NotFoundException("حراج مرتبط پیدا نشد");

        // چک کردن اینکه حراج فعال است
        if (auction.StartDate > DateTime.UtcNow || auction.EndDate < DateTime.UtcNow)
            throw new InvalidOperationException("حراج در حال حاضر فعال نیست");

        // اعتبارسنجی مبلغ پیشنهادی
        if (dto.BidAmount <= auction.StartingPrice)
            throw new InvalidOperationException($"مبلغ پیشنهادی باید بیشتر از قیمت اولیه ({auction.StartingPrice}) باشد");

        if (auction.CurrentPrice.HasValue && dto.BidAmount <= auction.CurrentPrice.Value && dto.BidAmount != entity.BidAmount)
            throw new InvalidOperationException($"مبلغ پیشنهادی باید بیشتر از قیمت جاری ({auction.CurrentPrice.Value}) باشد");

        entity.BidAmount = dto.BidAmount;

        await _auctionBidRepository.UpdateAsync(entity);

        // به‌روزرسانی قیمت جاری حراج
        var highestBidResult = await _auctionBidRepository.GetPagedAsync(
            filter: b => b.AuctionId == auction.AuctionId,
            pageNumber: 1,
            pageSize: 1,
            orderBy: b => b.BidAmount);
        auction.CurrentPrice = highestBidResult.Items.OrderByDescending(b => b.BidAmount).FirstOrDefault()?.BidAmount;
        await _auctionRepository.UpdateAsync(auction);

        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var entity = await _auctionBidRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        var auction = await _auctionRepository.GetByIdAsync(entity.AuctionId);
        if (auction == null)
            throw new NotFoundException("حراج مرتبط پیدا نشد");

        await _auctionBidRepository.DeleteAsync(entity);

        // به‌روزرسانی قیمت جاری حراج
        var highestBidResult = await _auctionBidRepository.GetPagedAsync(
            filter: b => b.AuctionId == auction.AuctionId,
            pageNumber: 1,
            pageSize: 1,
            orderBy: b => b.BidAmount);
        auction.CurrentPrice = highestBidResult.Items.OrderByDescending(b => b.BidAmount).FirstOrDefault()?.BidAmount;
        await _auctionRepository.UpdateAsync(auction);

        await _unitOfWork.SaveChangesAsync();
        return true;
    }
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