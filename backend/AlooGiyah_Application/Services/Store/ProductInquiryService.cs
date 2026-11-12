using AlooGiyah_Application.DTOs.ProductInquiry;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Application.Services.Store;

public sealed class ProductInquiryService(
    IGenericRepository<ProductInquiry> inquiries,
    IGenericRepository<AgriculturalListing> listings,
    ICurrentUserService currentUser,
    INotificationWriter notifications,
    IUnitOfWork unitOfWork) : IProductInquiryService
{
    public async Task<ProductInquiryDto> CreateAsync(ProductInquiryCreateDto dto)
    {
        var buyerId = CurrentUserId();
        var product = await listings.GetAll().Include(x => x.Farm).ThenInclude(x => x.Owner)
            .SingleOrDefaultAsync(x => (x.Code == dto.ProductCode || x.LegacyProductCode == dto.ProductCode)
                && !x.IsDeleted && !x.Farm.IsDeleted)
            ?? throw new NotFoundException("آگهی پیدا نشد.");
        if (product.Farm.OwnerId == buyerId)
            throw new BadRequestException("امکان ثبت درخواست برای آگهی خودتان وجود ندارد.");
        if (!product.IsPublished || product.Stock < 1)
            throw new BadRequestException("این آگهی دیگر برای درخواست خرید در دسترس نیست.");
        if (dto.Quantity > product.Stock)
            throw new BadRequestException("مقدار درخواستی بیشتر از موجودی آگهی است.");
        if (await inquiries.GetAll().AnyAsync(x => x.BuyerId == buyerId &&
            !x.IsDeleted && x.ListingId == product.AgriculturalListingId &&
            (x.Status == ProductInquiryStatuses.Requested || x.Status == ProductInquiryStatuses.Contacted)))
            throw new ConflictException("برای این آگهی یک درخواست در حال پیگیری دارید.");

        var inquiry = new ProductInquiry
        {
            ListingId = product.AgriculturalListingId,
            Listing = product,
            BuyerId = buyerId,
            SellerId = product.Farm.OwnerId,
            Quantity = dto.Quantity,
            UnitPrice = product.RetailPrice,
            EstimatedTotal = product.RetailPrice * dto.Quantity,
            ProductNameSnapshot = product.Name,
            FarmNameSnapshot = product.Farm.Name,
            SaleUnitSnapshot = product.SaleUnit,
            BuyerMessage = string.IsNullOrWhiteSpace(dto.Message) ? null : dto.Message.Trim()
        };
        await inquiries.AddAsync(inquiry);
        await notifications.AddForUserAsync(inquiry.SellerId, "درخواست خرید",
            $"برای آگهی «{inquiry.ProductNameSnapshot}» یک درخواست خرید جدید ثبت شد.");
        await notifications.AddForUserAsync(inquiry.BuyerId, "درخواست خرید",
            $"درخواست خرید «{inquiry.ProductNameSnapshot}» ثبت شد؛ برای هماهنگی مستقیم با فروشنده گفت‌وگو را باز کنید.");
        await unitOfWork.SaveChangesAsync();
        return Map(inquiry, product.Farm.Owner, null);
    }

    public async Task<PagedResult<ProductInquiryDto>> GetMineAsync(string role, string filter, int page, int pageSize)
    {
        var actor = CurrentUserId();
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var isSeller = string.Equals(role, "Seller", StringComparison.OrdinalIgnoreCase);
        var query = inquiries.GetAll().AsNoTracking().Include(x => x.Listing).ThenInclude(x => x.Farm).Include(x => x.Buyer).Include(x => x.Seller)
            .Where(x => !x.IsDeleted && (isSeller ? x.SellerId == actor : x.BuyerId == actor));
        switch ((filter ?? "All").Trim().ToLowerInvariant())
        {
            case "all":
            case "":
                break;
            case "pending":
                query = query.Where(x => x.Status == ProductInquiryStatuses.Requested);
                break;
            case "reviewed":
                query = query.Where(x => x.Status != ProductInquiryStatuses.Requested);
                break;
            default:
                throw new BadRequestException("فیلتر درخواست معتبر نیست.");
        }
        var totalCount = await query.CountAsync();
        var rows = await query.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.ProductInquiryId)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResult<ProductInquiryDto>
        {
            Items = rows.Select(x => Map(x, x.Seller, x.Buyer)).ToList(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<ProductInquiryDto> ActAsync(string code, ProductInquiryActionDto dto)
    {
        var actor = CurrentUserId();
        var inquiry = await inquiries.GetAll().Include(x => x.Listing).ThenInclude(x => x.Farm).Include(x => x.Buyer).Include(x => x.Seller)
            .SingleOrDefaultAsync(x => x.Code == code && !x.IsDeleted)
            ?? throw new NotFoundException("درخواست پیدا نشد.");
        var next = dto.Status.Trim();
        var sellerAction = next is ProductInquiryStatuses.Contacted or ProductInquiryStatuses.Agreed or ProductInquiryStatuses.Declined;
        var buyerAction = next == ProductInquiryStatuses.Cancelled;
        if ((sellerAction && inquiry.SellerId != actor) || (buyerAction && inquiry.BuyerId != actor) || (!sellerAction && !buyerAction))
            throw new ForbiddenException("اجازهٔ تغییر این درخواست را ندارید.");
        if (inquiry.Status is ProductInquiryStatuses.Declined or ProductInquiryStatuses.Cancelled)
            throw new BadRequestException("این درخواست بسته شده است.");

        inquiry.Status = next;
        inquiry.RespondedAt = DateTimeOffset.UtcNow;
        inquiry.UpdatedAt = inquiry.RespondedAt;
        var recipient = inquiry.SellerId == actor ? inquiry.BuyerId : inquiry.SellerId;
        await notifications.AddForUserAsync(recipient, "درخواست خرید",
            $"وضعیت درخواست «{inquiry.ProductNameSnapshot}» تغییر کرد.");
        await unitOfWork.SaveChangesAsync();
        return Map(inquiry, inquiry.Seller, inquiry.Buyer);
    }

    private int CurrentUserId() =>
        currentUser.IsAuthenticated && !currentUser.IsGuest && int.TryParse(currentUser.UserId, out var id)
            ? id : throw new UnauthorizedException("ابتدا وارد حساب کاربری شوید.");

    private static ProductInquiryDto Map(ProductInquiry inquiry, User seller, User? buyer) => new()
    {
        Code = inquiry.Code,
        ProductCode = inquiry.Listing.Code,
        ProductName = inquiry.ProductNameSnapshot,
        PrimaryImageUrl = !inquiry.Listing.IsDeleted && !inquiry.Listing.Farm.IsDeleted
            ? inquiry.Listing.ImageUrls.FirstOrDefault() : null,
        FarmCode = inquiry.Listing.Farm.Code,
        FarmName = inquiry.FarmNameSnapshot,
        SaleUnit = inquiry.SaleUnitSnapshot ?? "Piece",
        Quantity = inquiry.Quantity,
        UnitPrice = inquiry.UnitPrice,
        EstimatedTotal = inquiry.EstimatedTotal,
        Status = inquiry.Status,
        BuyerCode = buyer?.Code ?? string.Empty,
        BuyerName = buyer == null ? string.Empty : $"{buyer.FName} {buyer.LName}".Trim(),
        SellerCode = seller.Code,
        SellerName = $"{seller.FName} {seller.LName}".Trim(),
        Message = inquiry.BuyerMessage,
        CreatedAt = inquiry.CreatedAt,
        RespondedAt = inquiry.RespondedAt
    };
}
