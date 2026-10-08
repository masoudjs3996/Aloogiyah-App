using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.Auction;
using AlooGiyah_Application.DTOs.AuctionBid;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System.Linq.Expressions;
using System.Data;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Application.Services.Store;

public class AuctionService : IAuctionService
{
    private readonly IAuctionQuery _readQuery;

    #region Constructor
    private readonly IGenericRepository<Auction> _auctionRepository;
    private readonly IGenericRepository<AgriculturalProduct> _agriculturalProductRepository;
    private readonly IGenericRepository<User> _userRepository;
    private readonly IGenericRepository<Status> _statusRepository;
    private readonly IGenericRepository<AuctionBid> _auctionBidRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUser;

    public AuctionService(IAuctionQuery readQuery,
        
        IGenericRepository<Auction> auctionRepository,
        IGenericRepository<AgriculturalProduct> agriculturalProductRepository,
        IGenericRepository<User> userRepository,
        IGenericRepository<Status> statusRepository,
        IGenericRepository<AuctionBid> auctionBidRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICurrentUserService currentUser)
    {
        _readQuery = readQuery;
        _auctionRepository = auctionRepository;
        _agriculturalProductRepository = agriculturalProductRepository;
        _userRepository = userRepository;
        _statusRepository = statusRepository;
        _auctionBidRepository = auctionBidRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _currentUser = currentUser;
    }
    #endregion


    #region Create
    public async Task<AuctionDto> CreateAsync(AuctionCreateDto dto)
    {
        var actorId = CurrentUserId();
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
        var product = await _agriculturalProductRepository.GetAll().Include(x => x.Farm)
            .SingleOrDefaultAsync(x => x.AgriculturalProductId == productId.Value);
        if (product == null || product.Stock <= 0)
            throw new InvalidOperationException("محصول موجود نیست یا موجودی کافی ندارد");
        if (!IsManager && product.Farm.OwnerId != actorId)
            throw new ForbiddenException("فقط مالک مزرعه می‌تواند برای محصول خود حراج بسازد.");

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
        CurrentUserId();
        if (!IsManager) throw new ForbiddenException("ویرایش حراج فقط برای مدیریت مجاز است.");
        throw new BadRequestException("وضعیت و برنده حراج فقط از مسیر نهایی‌سازی تغییر می‌کند.");
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var actorId = CurrentUserId();
        var entity = await _auctionRepository.GetAll().Include(x => x.AgriculturalProduct).ThenInclude(x => x.Farm)
            .SingleOrDefaultAsync(x => x.Code == code);
        if (entity == null)
            return false;

        if (!IsManager && entity.AgriculturalProduct.Farm.OwnerId != actorId)
            throw new ForbiddenException("حذف این حراج برای شما مجاز نیست.");
        if (!IsManager && entity.StartDate <= DateTimeOffset.UtcNow)
            throw new BadRequestException("پس از شروع حراج، مالک نمی‌تواند آن را حذف کند.");
        if (await _auctionBidRepository.GetAll().AnyAsync(b => b.AuctionId == entity.AuctionId))
            throw new BadRequestException("حراج دارای پیشنهاد است و قابل حذف نیست.");

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
        return await _readQuery.GetByCodeAsync(code);
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<AuctionDto>> GetByFilterAsync(AuctionFilterDto filter)
    {
        return await _readQuery.GetByFilterAsync(filter);
    }
    #endregion

    #region Finalize
    public async Task<bool> FinalizeAuctionAsync(string code)
    {
        CurrentUserId();
        if (!IsManager) throw new ForbiddenException("نهایی‌کردن حراج فقط برای مدیریت مجاز است.");
        await using var tx = await _unitOfWork.BeginTransactionAsync(IsolationLevel.Serializable);
        var entity = await _auctionRepository.GetAll().Include(x => x.Status)
            .SingleOrDefaultAsync(x => x.Code == code);
        if (entity == null)
            return false;

        if (entity.Status?.Code == "COMPLETED")
        {
            await tx.CommitAsync();
            return true;
        }

        // چک کردن اینکه حراج تمام شده یا خیر
        if (entity.EndDate > DateTime.UtcNow)
            throw new InvalidOperationException("حراج هنوز به پایان نرسیده است");

        // گرفتن بالاترین پیشنهاد
        var highestBid = await _auctionBidRepository.GetAll().Where(b => b.AuctionId == entity.AuctionId)
            .OrderByDescending(b => b.BidAmount).ThenBy(b => b.CreatedAt).ThenBy(b => b.AuctionBidId)
            .FirstOrDefaultAsync();

        if (highestBid != null)
        {
            var product = await _agriculturalProductRepository.GetByIdAsync(entity.AgriculturalProductId);
            if (product == null || product.Stock <= 0)
                throw new ConflictException("محصول موجود نیست یا موجودی کافی ندارد.");
            product.Stock -= 1;
            entity.WinnerId = highestBid.UserId;
            entity.CurrentPrice = highestBid.BidAmount;
            await _agriculturalProductRepository.UpdateAsync(product);
        }
        entity.StatusId = (await _statusRepository.FirstOrDefaultAsync(s => s.Code == "COMPLETED"))?.StatusId
            ?? throw new NotFoundException("وضعیت 'تکمیل‌شده' پیدا نشد");

        await _auctionRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        await tx.CommitAsync();
        return true;
    }

    private int CurrentUserId()
    {
        if (!_currentUser.IsAuthenticated || _currentUser.IsGuest || !int.TryParse(_currentUser.UserId, out var id))
            throw new UnauthorizedException("ابتدا وارد حساب کاربری شوید.");
        return id;
    }

    private bool IsManager => _currentUser.Roles.Contains("Manager") || _currentUser.Roles.Contains("Admin");
    #endregion
}
