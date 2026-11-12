using System.Data;
using AlooGiyah_Application.DTOs.Discount;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Application.Services.Store;

public class SellerSalesService(IGenericRepository<Farm> farms, IGenericRepository<AgriculturalProduct> products,
    IGenericRepository<AgriculturalOrder> orders, IGenericRepository<Discount> discounts,
    IGenericRepository<User> users, IGenericRepository<ChatConversation> conversations,
    ICurrentUserService current, IUnitOfWork unit)
{
    private int SellerId()
    {
        if (!current.IsAuthenticated || current.IsGuest || !int.TryParse(current.UserId, out var id))
            throw new UnauthorizedException("ابتدا وارد حساب شوید.");
        if (!current.Roles.Contains("Farmer")) throw new ForbiddenException("این بخش مخصوص کشاورز است.");
        return id;
    }
    private IQueryable<AgriculturalOrder> CustomerOrders(int seller) => orders.GetAll().Where(x =>
        x.Farm != null && x.Farm.OwnerId == seller && !x.Farm.IsDeleted && !x.Buyer.IsDeleted &&
        (x.IsPaid || x.IsHeld || x.Checkout != null && x.Checkout.IsSubmitted));
    private static IQueryable<AgriculturalOrder> CompletedSales(IQueryable<AgriculturalOrder> query) => query.Where(x =>
        x.IsPaid && (x.Status.Code == AgriculturalOrderStatuses.Approved ||
        x.Status.Code == AgriculturalOrderStatuses.Shipped || x.Status.Code == AgriculturalOrderStatuses.Delivered));
    public async Task<SellerSalesSummaryDto> Summary()
    {
        var id = SellerId(); var query = CustomerOrders(id); var now = DateTimeOffset.UtcNow;
        return new(await query.Select(x => x.BuyerId).Distinct().CountAsync(), await query.CountAsync(),
            await CompletedSales(query).SumAsync(x => (decimal?)x.TotalPrice) ?? 0,
            await discounts.GetAll().CountAsync(x => x.IssuerSellerId == id && x.Farm != null && x.Farm.OwnerId == id &&
                x.IsActive && (x.EndDate == null || x.EndDate > now) && (x.MaxUsage == null || x.UsageCount < x.MaxUsage)));
    }
    public async Task<PagedResult<SellerCustomerDto>> Customers(string? search, int page = 1)
    {
        var id = SellerId(); page = Math.Max(1, page);
        var query = CustomerOrders(id);
        if (!string.IsNullOrWhiteSpace(search)) { var term = search.Trim(); query = query.Where(x => (x.Buyer.FName + " " + x.Buyer.LName).Contains(term)); }
        var grouped = query.Select(x => new { x.BuyerId, x.Buyer.Code, x.Buyer.FName, x.Buyer.LName, x.CreatedAt,
            Amount = x.IsPaid && (x.Status.Code == AgriculturalOrderStatuses.Approved || x.Status.Code == AgriculturalOrderStatuses.Shipped || x.Status.Code == AgriculturalOrderStatuses.Delivered) ? x.TotalPrice : 0 })
            .GroupBy(x => new { x.BuyerId, x.Code, x.FName, x.LName });
        var count = await grouped.CountAsync();
        var rows = await grouped.Select(g => new { g.Key.Code, Name = g.Key.FName + " " + g.Key.LName,
            OrderCount = g.Count(), PurchasedAmount = g.Sum(x => x.Amount), LastOrderAt = g.Max(x => x.CreatedAt) })
            .OrderByDescending(x => x.LastOrderAt).ThenBy(x => x.Code).Skip((page - 1) * 20).Take(20).ToListAsync();
        return new() { Items = rows.Select(x => new SellerCustomerDto(x.Code, x.Name, x.OrderCount, x.PurchasedAmount, x.LastOrderAt)).ToList(), TotalCount = count, PageNumber = page, PageSize = 20 };
    }
    public async Task<PagedResult<SellerCustomerOrderDto>> CustomerHistory(string code, int page = 1)
    {
        var id = SellerId(); page = Math.Max(1, page);
        var query = CustomerOrders(id).Where(x => x.Buyer.Code == code);
        return new() { TotalCount = await query.CountAsync(), PageNumber = page, PageSize = 20,
            Items = await query.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Code).Skip((page - 1) * 20).Take(20)
                .Select(x => new SellerCustomerOrderDto(x.Code, x.FarmNameSnapshot, x.TotalPrice, x.IsPaid, x.Status.Name, x.CreatedAt)).ToListAsync() };
    }
    private async Task<User> Recipient(string code, int id)
    {
        var recipient = await users.GetAll().SingleOrDefaultAsync(x => x.Code == code && x.UserId != id)
            ?? throw new NotFoundException("مخاطب یافت نشد.");
        var related = await CustomerOrders(id).AnyAsync(x => x.BuyerId == recipient.UserId) ||
            await conversations.GetAll().AnyAsync(x => (x.ParticipantOneId == id && x.ParticipantTwoId == recipient.UserId ||
                x.ParticipantTwoId == id && x.ParticipantOneId == recipient.UserId));
        if (!related) throw new ForbiddenException("فقط برای مشتری یا مخاطب گفت‌وگوی خودتان می‌توانید کد بسازید.");
        return recipient;
    }
    public async Task<object> Customer(string code)
    {
        var id = SellerId(); var recipient = await Recipient(code, id);
        return new { recipient.Code, Name = recipient.FName + " " + recipient.LName };
    }
    public async Task<List<SellerProductDto>> Products()
    {
        var id = SellerId();
        return await products.GetAll().Where(x => x.Farm.OwnerId == id && !x.Farm.IsDeleted)
            .OrderBy(x => x.Farm.Name).ThenBy(x => x.Name)
            .Select(x => new SellerProductDto(x.Code, x.Name, x.Farm.Code, x.Farm.Name)).ToListAsync();
    }
    private IQueryable<Discount> MyDiscounts(int id) => discounts.GetAll().Where(x => x.IssuerSellerId == id &&
        x.Farm != null && x.Farm.OwnerId == id && !x.Farm.IsDeleted).Include(x => x.Farm).Include(x => x.Users).Include(x => x.agriculturalProducts);
    private static SellerDiscountDto Map(Discount x) => new(x.Code, x.Users.FirstOrDefault()?.Code ?? "",
        string.Join(" ", new[] { x.Users.FirstOrDefault()?.FName, x.Users.FirstOrDefault()?.LName }.Where(x => !string.IsNullOrWhiteSpace(x))),
        x.Farm!.Code, x.Farm.Name, x.DiscountType, x.Value, x.MaxDiscountAmount, x.EndDate, x.UsageCount, x.MaxUsage,
        x.IsActive, x.agriculturalProducts.Select(p => p.Code).ToList());
    public async Task<PagedResult<SellerDiscountDto>> Discounts(int page = 1)
    {
        var query = MyDiscounts(SellerId()); page = Math.Max(1, page);
        return new() { TotalCount = await query.CountAsync(), PageNumber = page, PageSize = 20,
            Items = (await query.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Code).Skip((page - 1) * 20).Take(20).ToListAsync()).Select(Map).ToList() };
    }
    public async Task<SellerDiscountDto> Create(SellerDiscountCreateDto dto)
    {
        var id = SellerId(); var now = DateTimeOffset.UtcNow;
        if (!Enum.IsDefined(dto.DiscountType) || dto.Value <= 0 || dto.Value > 99_999_999 ||
            dto.DiscountType == DiscountType.Percentage && dto.Value > 100 || dto.MaxDiscountAmount <= 0 ||
            dto.MaxDiscountAmount > 99_999_999 || dto.MaxUsage is < 1 or > 100 || dto.EndDate <= now || dto.EndDate > now.AddYears(1) ||
            decimal.Round(dto.Value, 2) != dto.Value || dto.MaxDiscountAmount.HasValue && decimal.Round(dto.MaxDiscountAmount.Value, 2) != dto.MaxDiscountAmount)
            throw new BadRequestException("مقدار تخفیف، سقف مبلغ، تعداد استفاده یا تاریخ پایان معتبر نیست.");
        if (dto.ProductCodes == null || dto.ProductCodes.Count > 200) throw new BadRequestException("فهرست محصولات معتبر نیست.");
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var recipient = await Recipient(dto.CustomerCode.Trim(), id);
        var farm = await farms.GetAll().SingleOrDefaultAsync(x => x.Code == dto.FarmCode.Trim() && x.OwnerId == id)
            ?? throw new ForbiddenException("فقط برای مزرعهٔ خودتان می‌توانید کد بسازید.");
        var codes = dto.ProductCodes.Select(x => x?.Trim() ?? "").Distinct().ToList();
        var selected = await products.GetAll().Where(x => codes.Contains(x.Code) && x.FarmId == farm.FarmId).ToListAsync();
        if (selected.Count != codes.Count) throw new ForbiddenException("محصول انتخابی باید متعلق به همین مزرعه باشد.");
        var discount = new Discount { IssuerSellerId = id, FundingSource = "Seller", FarmId = farm.FarmId, Farm = farm, Users = new() { recipient },
            agriculturalProducts = selected, Categories = new(), Products = new(), IsActive = true, ForQualityAssessment = false,
            DiscountType = dto.DiscountType, Value = dto.Value, MaxDiscountAmount = dto.MaxDiscountAmount,
            StartDate = now, EndDate = dto.EndDate.ToUniversalTime(), MaxUsage = dto.MaxUsage, UsageCount = 0 };
        await discounts.AddAsync(discount); await unit.SaveChangesAsync(); await tx.CommitAsync();
        return Map(discount);
    }
    public async Task Disable(string code)
    {
        var id = SellerId();
        await using var tx = await unit.BeginTransactionAsync(IsolationLevel.Serializable);
        var discount = await MyDiscounts(id).SingleOrDefaultAsync(x => x.Code == code)
            ?? throw new NotFoundException("کد تخفیف یافت نشد.");
        discount.IsActive = false; await unit.SaveChangesAsync(); await tx.CommitAsync();
    }
}
