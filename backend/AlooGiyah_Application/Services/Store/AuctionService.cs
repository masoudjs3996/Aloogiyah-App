using AlooGiyah_Application.DTOs.Auction;
using AlooGiyah_Application.DTOs.AuctionBid;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System.Linq.Expressions;

namespace AlooGiyah_Application.Services.Store;

public class AuctionService : IAuctionService
{
    #region Constructor
    private readonly IGenericRepository<Auction> _auctionRepository;
    private readonly IGenericRepository<AgriculturalProduct> _agriculturalProductRepository;
    private readonly IGenericRepository<User> _userRepository;
    private readonly IGenericRepository<Status> _statusRepository;
    private readonly IGenericRepository<AuctionBid> _auctionBidRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AuctionService(
        IGenericRepository<Auction> auctionRepository,
        IGenericRepository<AgriculturalProduct> agriculturalProductRepository,
        IGenericRepository<User> userRepository,
        IGenericRepository<Status> statusRepository,
        IGenericRepository<AuctionBid> auctionBidRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _auctionRepository = auctionRepository;
        _agriculturalProductRepository = agriculturalProductRepository;
        _userRepository = userRepository;
        _statusRepository = statusRepository;
        _auctionBidRepository = auctionBidRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion


    #region Create
    public async Task<AuctionDto> CreateAsync(AuctionCreateDto dto)
    {
        // اعتبارسنجی محصول
        var productId = await _agriculturalProductRepository.GetIdByCodeAsync(dto.AgriculturalProductCode, p => p.AgriculturalProductId);
        if (productId == null)
            throw new NotFoundException($"محصول کشاورزی با کد {dto.AgriculturalProductCode} پیدا نشد");

        // اعتبارسنجی وضعیت
        var statusId = await _statusRepository.GetIdByCodeAsync(dto.StatusCode, s => s.StatusId);
        if (statusId == null)
            throw new NotFoundException($"وضعیت با کد {dto.StatusCode} پیدا نشد");

        // اعتبارسنجی تاریخ‌ها
        if (dto.StartDate >= dto.EndDate)
            throw new InvalidOperationException("تاریخ شروع باید قبل از تاریخ پایان باشد");

        if (dto.StartingPrice <= 0)
            throw new InvalidOperationException("قیمت اولیه باید بیشتر از صفر باشد");

        // چک کردن موجودی محصول
        var product = await _agriculturalProductRepository.GetByIdAsync(productId.Value);
        if (product == null || product.Stock <= 0)
            throw new InvalidOperationException("محصول موجود نیست یا موجودی کافی ندارد");

        var entity = _mapper.Map<Auction>(dto);
        entity.AgriculturalProductId = productId.Value;
        entity.StatusId = statusId.Value;

        await _auctionRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        var auctionDto = _mapper.Map<AuctionDto>(entity);
        auctionDto.AgriculturalProductCode = dto.AgriculturalProductCode;
        auctionDto.StatusCode = dto.StatusCode;

        return auctionDto;
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(AuctionUpdateDto dto)
    {
        var entity = await _auctionRepository.GetByCodeAsync(dto.Code);
        if (entity == null)
            return false;

        // اعتبارسنجی وضعیت
        var statusId = await _statusRepository.GetIdByCodeAsync(dto.StatusCode, s => s.StatusId);
        if (statusId == null)
            throw new NotFoundException($"وضعیت با کد {dto.StatusCode} پیدا نشد");

        // اعتبارسنجی برنده (اگر مشخص شده)
        int? winnerId = null;
        if (!string.IsNullOrEmpty(dto.WinnerCode))
        {
            winnerId = await _userRepository.GetIdByCodeAsync(dto.WinnerCode, u => u.UserId);
            if (winnerId == null)
                throw new NotFoundException($"کاربر با کد {dto.WinnerCode} پیدا نشد");
        }

        entity.StatusId = statusId.Value;
        entity.WinnerId = winnerId;

        await _auctionRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var entity = await _auctionRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        // حذف پیشنهادهای مرتبط
        var bidsResult = await _auctionBidRepository.GetPagedAsync(
            filter: b => b.AuctionId == entity.AuctionId,
            pageNumber: 1,
            pageSize: int.MaxValue);
        foreach (var bid in bidsResult.Items)
        {
            await _auctionBidRepository.DeleteAsync(bid);
        }

        await _auctionRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Get By Code
    public async Task<AuctionDto?> GetByCodeAsync(string code)
    {
        var entity = await _auctionRepository.GetByCodeAsync(code);
        if (entity == null)
            return null;

        var auctionDto = _mapper.Map<AuctionDto>(entity);
        auctionDto.AgriculturalProductCode = await _agriculturalProductRepository.GetCodeByIdAsync(entity.AgriculturalProductId) ?? string.Empty;
        auctionDto.StatusCode = await _statusRepository.GetCodeByIdAsync(entity.StatusId) ?? string.Empty;
        auctionDto.WinnerCode = entity.WinnerId.HasValue ? await _userRepository.GetCodeByIdAsync(entity.WinnerId.Value) ?? string.Empty : string.Empty;
        auctionDto.Bids = entity.Bids.Select(b => new AuctionBidDto
        {
            Code = b.Code,
            BidAmount = b.BidAmount,
            CreatedAt = b.CreatedAt
        }).ToList();

        return auctionDto;
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<AuctionDto>> GetByFilterAsync(AuctionFilterDto filter)
    {
        Expression<Func<Auction, bool>> predicate = a => !a.IsDeleted;

        if (!string.IsNullOrEmpty(filter.ProductCode))
            predicate = predicate.And(a => a.AgriculturalProduct.Code == filter.ProductCode);

        if (!string.IsNullOrEmpty(filter.StatusCode))
            predicate = predicate.And(a => a.Status.Code == filter.StatusCode);

        if (!string.IsNullOrEmpty(filter.WinnerCode))
            predicate = predicate.And(a => a.Winner != null && a.Winner.Code == filter.WinnerCode);

        if (filter.StartDateFrom.HasValue)
            predicate = predicate.And(a => a.StartDate >= filter.StartDateFrom.Value);

        if (filter.StartDateTo.HasValue)
            predicate = predicate.And(a => a.StartDate <= filter.StartDateTo.Value);

        if (filter.EndDateFrom.HasValue)
            predicate = predicate.And(a => a.EndDate >= filter.EndDateFrom.Value);

        if (filter.EndDateTo.HasValue)
            predicate = predicate.And(a => a.EndDate <= filter.EndDateTo.Value);

        if (filter.MinStartingPrice.HasValue)
            predicate = predicate.And(a => a.StartingPrice >= filter.MinStartingPrice.Value);

        if (filter.MaxStartingPrice.HasValue)
            predicate = predicate.And(a => a.StartingPrice <= filter.MaxStartingPrice.Value);

        return await _auctionRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: a => new AuctionDto
            {
                Code = a.Code,
                AgriculturalProductCode = a.AgriculturalProduct.Code,
                StartDate = a.StartDate,
                EndDate = a.EndDate,
                StartingPrice = a.StartingPrice,
                CurrentPrice = a.CurrentPrice,
                WinnerCode = a.Winner != null ? a.Winner.Code : string.Empty,
                StatusCode = a.Status.Code,
                CreatedAt = a.CreatedAt,
                Bids = a.Bids.Select(b => new AuctionBidDto
                {
                    Code = b.Code,
                    BidAmount = b.BidAmount,
                    CreatedAt = b.CreatedAt
                }).ToList()
            },
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: a => a.CreatedAt
        );
    }
    #endregion

    #region Finalize
    public async Task<bool> FinalizeAuctionAsync(string code)
    {
        var entity = await _auctionRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        // چک کردن اینکه حراج تمام شده یا خیر
        if (entity.EndDate > DateTime.UtcNow)
            throw new InvalidOperationException("حراج هنوز به پایان نرسیده است");

        // گرفتن بالاترین پیشنهاد
        var bidsResult = await _auctionBidRepository.GetPagedAsync(
            filter: b => b.AuctionId == entity.AuctionId,
            pageNumber: 1,
            pageSize: 1,
            orderBy: b => b.BidAmount);
        var highestBid = bidsResult.Items.OrderByDescending(b => b.BidAmount).FirstOrDefault();

        if (highestBid == null)
            throw new InvalidOperationException("هیچ پیشنهادی برای این حراج ثبت نشده است");

        // به‌روزرسانی موجودی محصول
        var product = await _agriculturalProductRepository.GetByIdAsync(entity.AgriculturalProductId);
        if (product == null || product.Stock <= 0)
            throw new InvalidOperationException("محصول موجود نیست یا موجودی کافی ندارد");

        product.Stock -= 1; // فرض می‌کنیم هر حراج برای یک واحد محصول است
        await _agriculturalProductRepository.UpdateAsync(product);

        // تنظیم برنده و قیمت جاری
        entity.WinnerId = highestBid.UserId;
        entity.CurrentPrice = highestBid.BidAmount;
        entity.StatusId = (await _statusRepository.FirstOrDefaultAsync(s => s.Code == "COMPLETED"))?.StatusId
            ?? throw new NotFoundException("وضعیت 'تکمیل‌شده' پیدا نشد");

        await _auctionRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion
}