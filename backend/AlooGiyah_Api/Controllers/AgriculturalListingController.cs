using System.ComponentModel.DataAnnotations;
using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Application.DTOs.BaseDto;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Persistence.Context;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using AlooGiyah_Shared.Seo;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Api.Controllers;

[ApiController, Route("api/[controller]")]
public sealed class AgriculturalListingController(
    AlooGiyahDbContext db, ICurrentUserService actor, IFileStorageService storage,
    AlooGiyah_Application.Services.ContentModeration moderation) : ControllerBase
{
    public class ListingInput
    {
        public string? Code { get; set; }
        public string? FarmCode { get; set; }
        public string? GreenhouseCode { get; set; }
        [Required, MaxLength(255)] public string Name { get; set; } = "";
        [MaxLength(1000)] public string? Description { get; set; }
        [RegularExpression("^(Kilogram|Package|Piece)$")] public string? SaleUnit { get; set; }
        public decimal RetailPrice { get; set; }
        [Range(0, int.MaxValue)] public int Stock { get; set; }
        [Range(0, int.MaxValue)] public int? DailyProductionCapacity { get; set; }
        public string? ProductTemplateCode { get; set; }
        public List<string> CategoryCodes { get; set; } = [];
        public List<ProductSpecificationValueInput> Specifications { get; set; } = [];
    }

    public sealed class ListingCreateInput : ListingInput
    {
        public List<IFormFile> Images { get; set; } = [];
    }

    public sealed class ListingFilter : BaseFilterDto
    {
        public string? Name { get; set; }
        public string? FarmCode { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public int? MinStock { get; set; }
        public int? MaxStock { get; set; }
        public List<string> CategoryCodes { get; set; } = [];
        public string? ProductCode { get; set; }
        public string? ProductTemplateCode { get; set; }
        public List<string> SpecificationOptionCodes { get; set; } = [];
        public string? ProvinceCode { get; set; }
        public string? CountyCode { get; set; }
        public string? LocalityCode { get; set; }
    }

    private bool IsManager => actor.Roles.Any(role => role is "Admin" or "Manager");
    private int? UserId => int.TryParse(actor.UserId, out var id) ? id : null;

    [HttpGet("GetByFilter"), HttpGet("GetPage"), HttpGet("GetSimilar"), AllowAnonymous]
    public async Task<IActionResult> List([FromQuery] ListingFilter filter, CancellationToken ct)
    {
        var isSimilar = Request.Path.Value?.EndsWith("/GetSimilar", StringComparison.OrdinalIgnoreCase) == true;
        var rows = db.AgriculturalListings.AsNoTracking().Where(x => !x.IsDeleted && !x.Farm.IsDeleted);
        if (isSimilar || string.IsNullOrEmpty(filter.FarmCode))
            rows = rows.Where(x => x.IsPublished);
        else
            rows = rows.Where(x => x.Farm.Code == filter.FarmCode &&
                (x.IsPublished || IsManager || x.Farm.OwnerId == UserId));
        if (!string.IsNullOrWhiteSpace(filter.Name))
        {
            var pattern = "%" + filter.Name.Trim() + "%";
            var matches = CategorySubtree([], pattern);
            rows = rows.Where(x => EF.Functions.ILike(x.Name, pattern) ||
                (x.ProductTemplate != null
                    ? matches.Contains(x.ProductTemplate.CategoryId)
                    : x.Categories.Any(c => matches.Contains(c.CategoryId))));
        }
        if (filter.CategoryCodes.Count > 0)
        {
            var descendants = CategorySubtree(filter.CategoryCodes.Distinct().ToArray(), null);
            rows = rows.Where(x => x.ProductTemplate != null
                ? descendants.Contains(x.ProductTemplate.CategoryId)
                : x.Categories.Any(c => descendants.Contains(c.CategoryId)));
        }
        if (filter.MinPrice.HasValue) rows = rows.Where(x => x.RetailPrice >= filter.MinPrice);
        if (filter.MaxPrice.HasValue) rows = rows.Where(x => x.RetailPrice <= filter.MaxPrice);
        if (filter.MinStock.HasValue) rows = rows.Where(x => x.Stock >= filter.MinStock);
        if (filter.MaxStock.HasValue) rows = rows.Where(x => x.Stock <= filter.MaxStock);
        if (!string.IsNullOrWhiteSpace(filter.ProvinceCode))
            rows = rows.Where(x => x.Farm.Address != null && x.Farm.Address.Province.Code == filter.ProvinceCode);
        if (!string.IsNullOrWhiteSpace(filter.CountyCode))
            rows = rows.Where(x => x.Farm.Address != null && x.Farm.Address.County.Code == filter.CountyCode);
        if (!string.IsNullOrWhiteSpace(filter.LocalityCode))
            rows = rows.Where(x => x.Farm.Address != null &&
                ((x.Farm.Address.City != null && x.Farm.Address.City.Code == filter.LocalityCode) ||
                 (x.Farm.Address.Village != null && x.Farm.Address.Village.Code == filter.LocalityCode)));
        if (!string.IsNullOrWhiteSpace(filter.ProductTemplateCode))
            rows = rows.Where(x => x.ProductTemplate != null && x.ProductTemplate.IsActive &&
                !x.ProductTemplate.IsDeleted && x.ProductTemplate.Code == filter.ProductTemplateCode);
        var optionCodes = filter.SpecificationOptionCodes.Distinct().ToArray();
        if (optionCodes.Length > 0)
            rows = rows.Where(x => x.ProductTemplate != null && x.ProductTemplate.IsActive && !x.ProductTemplate.IsDeleted &&
                x.SpecificationValues.Count(v => !v.IsDeleted && v.Specification.IsActive && !v.Specification.IsDeleted &&
                    v.Option.IsActive && !v.Option.IsDeleted && optionCodes.Contains(v.Option.Code)) == optionCodes.Length);
        if (!isSimilar && !string.IsNullOrEmpty(filter.ProductCode))
        {
            var categoryIds = db.AgriculturalListings
                .Where(x => x.Code == filter.ProductCode || x.LegacyProductCode == filter.ProductCode)
                .SelectMany(x => x.Categories.Select(c => c.CategoryId));
            rows = rows.Where(x => x.Code != filter.ProductCode && x.LegacyProductCode != filter.ProductCode &&
                x.Categories.Any(c => categoryIds.Contains(c.CategoryId)));
        }

        var sorted = isSimilar ? await RankSuggestions(rows, filter.ProductCode, ct)
            : (filter.SortColumn?.ToLowerInvariant(), filter.SortDescending) switch
        {
            ("retailprice" or "price", true) => rows.OrderByDescending(x => x.RetailPrice),
            ("retailprice" or "price", false) => rows.OrderBy(x => x.RetailPrice),
            ("stock", true) => rows.OrderByDescending(x => x.Stock),
            ("stock", false) => rows.OrderBy(x => x.Stock),
            ("name", true) => rows.OrderByDescending(x => x.Name),
            ("name", false) => rows.OrderBy(x => x.Name),
            (_, false) => rows.OrderBy(x => x.CreatedAt),
            _ => rows.OrderByDescending(x => x.CreatedAt)
        };
        var skip = (int)Math.Min(int.MaxValue, (long)(filter.PageNumber - 1) * filter.PageSize);
        var items = await sorted.ThenByDescending(x => x.AgriculturalListingId).Skip(skip).Take(filter.PageSize)
            .Select(x => new
            {
                Code = x.Code, Name = x.Name, Description = x.Description, Slug = x.Slug,
                FarmCode = x.Farm.Code, SaleUnit = x.SaleUnit, RetailPrice = x.RetailPrice,
                x.Stock, x.CreatedAt,
                PrimaryImageUrl = x.ImageUrls.FirstOrDefault(), IsSellable = x.IsPublished && x.Stock > 0,
                StatusCode = x.IsPublished ? AgriculturalProductStatuses.Sellable : ""
            }).ToListAsync(ct);
        if (Request.Path.Value?.EndsWith("/GetPage", StringComparison.OrdinalIgnoreCase) == true)
            return Success(new
            {
                Items = items, TotalCount = await rows.CountAsync(ct), PageNumber = filter.PageNumber, PageSize = filter.PageSize
            });
        return Success(items);
    }

    private async Task<IOrderedQueryable<AgriculturalListing>> RankSuggestions(
        IQueryable<AgriculturalListing> rows, string? productCode, CancellationToken ct)
    {
        var reference = string.IsNullOrEmpty(productCode) ? null : await Find(productCode).AsNoTracking()
            .Where(x => x.IsPublished || IsManager || x.Farm.OwnerId == UserId)
            .Select(x => new
            {
                x.AgriculturalListingId,
                x.AgriculturalProductTemplateId,
                TemplateCategoryId = x.ProductTemplate != null ? (int?)x.ProductTemplate.CategoryId : null,
                CategoryIds = x.Categories.Where(c => !c.IsDeleted).Select(c => c.CategoryId).ToArray(),
                OptionIds = x.SpecificationValues.Where(v => !v.IsDeleted && !v.Specification.IsDeleted &&
                    v.Specification.IsActive && !v.Option.IsDeleted && v.Option.IsActive)
                    .Select(v => v.AgriculturalProductTemplateSpecificationOptionId).ToArray()
            }).SingleOrDefaultAsync(ct);
        if (reference == null)
            return rows.OrderByDescending(x => x.Stock > 0).ThenByDescending(x => x.CreatedAt);

        var templateId = reference.AgriculturalProductTemplateId;
        var optionIds = reference.OptionIds;
        var categoryIds = reference.TemplateCategoryId is int categoryId ? new[] { categoryId } : reference.CategoryIds;
        var distances = db.Database.SqlQuery<CategoryDistance>($"""
            WITH RECURSIVE related AS (
                SELECT c."CategoryId", c."ParentCategoryId", 0 AS "Distance", ARRAY[c."CategoryId"] AS path
                FROM "Categories" c WHERE NOT c."IsDeleted" AND c."CategoryId" = ANY({categoryIds})
                UNION ALL
                SELECT c."CategoryId", c."ParentCategoryId", r."Distance" + 1, r.path || c."CategoryId"
                FROM related r JOIN "Categories" c
                    ON c."CategoryId" = r."ParentCategoryId" OR c."ParentCategoryId" = r."CategoryId"
                WHERE NOT c."IsDeleted" AND NOT c."CategoryId" = ANY(r.path)
            )
            SELECT "CategoryId", MIN("Distance") AS "Distance" FROM related GROUP BY "CategoryId"
            """);

        return rows.Where(x => x.AgriculturalListingId != reference.AgriculturalListingId)
            .OrderByDescending(x => templateId.HasValue && x.AgriculturalProductTemplateId == templateId)
            .ThenByDescending(x => x.SpecificationValues.Count(v => !v.IsDeleted && optionIds.Contains(v.AgriculturalProductTemplateSpecificationOptionId)))
            .ThenBy(x => distances.Where(d => x.ProductTemplate != null
                    ? d.CategoryId == x.ProductTemplate.CategoryId
                    : x.Categories.Any(c => c.CategoryId == d.CategoryId))
                .Select(d => (int?)d.Distance).Min() ?? int.MaxValue)
            .ThenByDescending(x => x.Stock > 0)
            .ThenByDescending(x => x.CreatedAt);
    }

    private sealed class CategoryDistance
    {
        public int CategoryId { get; set; }
        public int Distance { get; set; }
    }

    [HttpGet("GetByCode"), AllowAnonymous]
    public async Task<IActionResult> Detail(string code, CancellationToken ct)
    {
        var listing = await Find(code).AsNoTracking().Include(x => x.Categories)
            .Include(x => x.ProductTemplate).Include(x => x.SpecificationValues).ThenInclude(x => x.Option)
            .Include(x => x.SpecificationValues).ThenInclude(x => x.Specification).AsSplitQuery()
            .SingleOrDefaultAsync(ct) ?? throw new NotFoundException("آگهی پیدا نشد.");
        if (!listing.IsPublished && !IsManager && listing.Farm.OwnerId != UserId)
            throw new NotFoundException("آگهی پیدا نشد.");
        return Success(new
        {
            listing.Code, listing.Name, listing.Description, listing.Slug, listing.SaleUnit,
            listing.RetailPrice, listing.Stock, listing.DailyProductionCapacity,
            listing.CreatedAt, listing.ImageUrls, PrimaryImageUrl = listing.ImageUrls.FirstOrDefault(),
            FarmCode = listing.Farm.Code, GreenhouseCode = listing.Farm.Code,
            StatusCode = listing.IsPublished ? AgriculturalProductStatuses.Sellable : "",
            IsSellable = listing.IsPublished && listing.Stock > 0,
            CategoryCodes = listing.Categories.Select(x => x.Code),
            ProductTemplateCode = listing.ProductTemplate?.Code,
            ProductTemplateName = listing.ProductTemplate?.Name,
            Specifications = listing.SpecificationValues
                .Where(x => !x.IsDeleted && !x.Specification.IsDeleted && x.Specification.IsActive &&
                    !x.Option.IsDeleted && x.Option.IsActive)
                .OrderBy(x => x.Specification.SortOrder)
                .ThenBy(x => x.Specification.Name)
                .Select(x => new ProductSpecificationValueDto
                {
                    SpecificationCode = x.Specification.Code, Name = x.Specification.Name,
                    OptionCode = x.Option.Code, Value = x.Option.Label, SortOrder = x.Specification.SortOrder,
                    ColorHex = x.Option.ColorHex, Icon = x.Option.Icon
                })
        });
    }

    [HttpPost("CreateWithImages"), Authorize(Roles = "Admin,Manager,Farmer")]
    public async Task<IActionResult> Create([FromForm] ListingCreateInput input, CancellationToken ct)
    {
        var farm = await db.Farms.SingleOrDefaultAsync(x => x.Code == input.FarmCode && !x.IsDeleted, ct)
            ?? throw new NotFoundException("مزرعه پیدا نشد.");
        EnsureOwner(farm.OwnerId);
        var listing = new AgriculturalListing
        {
            FarmId = farm.FarmId,
            Slug = SeoHelper.GenerateSlug(input.Name)
        };
        await Apply(listing, input, ct);
        db.AgriculturalListings.Add(listing);
        await SaveWithImages(listing, input.Images, ct);
        return Success(new { listing.Code });
    }

    [HttpPut("Update"), Authorize(Roles = "Admin,Manager,Farmer")]
    public async Task<IActionResult> Update([FromBody] ListingInput input, CancellationToken ct)
    {
        var listing = await Find(input.Code).Include(x => x.Categories).Include(x => x.SpecificationValues)
            .AsSplitQuery().SingleOrDefaultAsync(ct) ?? throw new NotFoundException("آگهی پیدا نشد.");
        EnsureOwner(listing.Farm.OwnerId);
        await Apply(listing, input, ct);
        listing.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Success(true);
    }

    [HttpDelete("Delete"), Authorize(Roles = "Admin,Manager,Farmer")]
    public async Task<IActionResult> Delete(string code, CancellationToken ct)
    {
        var listing = await Find(code).SingleOrDefaultAsync(ct) ?? throw new NotFoundException("آگهی پیدا نشد.");
        EnsureOwner(listing.Farm.OwnerId);
        listing.IsDeleted = true;
        listing.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Success(true);
    }

    [HttpPost("AddImages"), Authorize(Roles = "Admin,Manager,Farmer")]
    public async Task<IActionResult> AddImages(string productCode, [FromForm] List<IFormFile> files, CancellationToken ct)
    {
        var listing = await Find(productCode).SingleOrDefaultAsync(ct) ?? throw new NotFoundException("آگهی پیدا نشد.");
        EnsureOwner(listing.Farm.OwnerId);
        await SaveWithImages(listing, files, ct);
        return Success(true);
    }

    private IQueryable<AgriculturalListing> Find(string? code) =>
        db.AgriculturalListings.Include(x => x.Farm)
            .Where(x => code != null && (x.Code == code || x.LegacyProductCode == code) && !x.IsDeleted && !x.Farm.IsDeleted);

    private IQueryable<int> CategorySubtree(string[] codes, string? namePattern) =>
        db.Database.SqlQuery<int>($"""
            WITH RECURSIVE selected_categories AS (
                SELECT "CategoryId" FROM "Categories"
                WHERE NOT "IsDeleted" AND ("Code" = ANY({codes}) OR "Name" ILIKE {namePattern})
                UNION
                SELECT child."CategoryId" FROM "Categories" child
                JOIN selected_categories parent ON parent."CategoryId" = child."ParentCategoryId"
                WHERE NOT child."IsDeleted"
            )
            SELECT "CategoryId" AS "Value" FROM selected_categories
            """);

    private void EnsureOwner(int ownerId)
    {
        if (!IsManager && ownerId != UserId)
            throw new ForbiddenException("فقط مالک مزرعه می‌تواند آگهی را تغییر دهد.");
    }

    private async Task Apply(AgriculturalListing listing, ListingInput input, CancellationToken ct)
    {
        moderation.Validate(input.Name, input.Description);
        if (input.RetailPrice < 0)
            throw new BadRequestException("قیمت نمی‌تواند منفی باشد.");
        var templates = db.AgriculturalProductTemplates.Where(x => !x.IsDeleted && x.IsActive && !x.Category.IsDeleted);
        AgriculturalProductTemplate? template = null;
        List<Category> categories;
        if (!string.IsNullOrWhiteSpace(input.ProductTemplateCode))
        {
            template = await templates.Include(x => x.Category)
                .Include(x => x.Specifications).ThenInclude(x => x.Options)
                .SingleOrDefaultAsync(x => x.Code == input.ProductTemplateCode, ct)
                ?? throw new BadRequestException("نوع محصول معتبر را انتخاب کنید.");
            categories = [template.Category];
        }
        else
        {
            // Keep category-based payloads working for older app versions.
            var categoryCodes = input.CategoryCodes.Distinct().ToArray();
            categories = await db.Categories.Where(x => categoryCodes.Contains(x.Code) && !x.IsDeleted).ToListAsync(ct);
            if ((listing.AgriculturalListingId == 0 && categories.Count == 0) || categories.Count != categoryCodes.Length)
                throw new BadRequestException("نوع محصول معتبر را انتخاب کنید.");
            var categoryIds = categories.Select(x => x.CategoryId).ToArray();
            if (await templates.AnyAsync(x => categoryIds.Contains(x.CategoryId), ct))
                throw new BadRequestException("نوع محصول معتبر را انتخاب کنید.");
        }

        var fields = template?.Specifications.Where(x => x.IsActive && !x.IsDeleted).ToList() ?? [];
        var submitted = input.Specifications.ToLookup(x => x.SpecificationCode);
        if (submitted.Any(x => x.Count() != 1 || fields.All(field => field.Code != x.Key)))
            throw new BadRequestException("مشخصات انتخاب‌شده معتبر نیست.");
        var selected = new Dictionary<int, int>();
        foreach (var field in fields)
        {
            var choice = submitted[field.Code].SingleOrDefault();
            if (choice == null && !field.IsRequired) continue;
            var option = field.Options.SingleOrDefault(x => x.Code == choice?.OptionCode && x.IsActive && !x.IsDeleted)
                ?? throw new BadRequestException($"برای «{field.Name}» یک گزینه معتبر انتخاب کنید.");
            selected.Add(field.AgriculturalProductTemplateSpecificationId, option.AgriculturalProductTemplateSpecificationOptionId);
        }
        foreach (var value in listing.SpecificationValues.ToArray())
        {
            if (selected.Remove(value.AgriculturalProductTemplateSpecificationId, out var optionId))
                value.AgriculturalProductTemplateSpecificationOptionId = optionId;
            else
                listing.SpecificationValues.Remove(value);
        }
        foreach (var (fieldId, optionId) in selected)
            listing.SpecificationValues.Add(new AgriculturalProductSpecificationValue
            {
                AgriculturalProductTemplateSpecificationId = fieldId,
                AgriculturalProductTemplateSpecificationOptionId = optionId
            });

        listing.Name = input.Name.Trim();
        listing.Description = input.Description?.Trim() ?? "";
        listing.SaleUnit = !string.IsNullOrWhiteSpace(input.SaleUnit)
            ? input.SaleUnit
            : listing.SaleUnit ?? template?.DefaultSaleUnit;
        listing.RetailPrice = input.RetailPrice;
        listing.Stock = input.Stock;
        listing.DailyProductionCapacity = input.DailyProductionCapacity;
        listing.AgriculturalProductTemplateId = template?.AgriculturalProductTemplateId;
        listing.Categories = categories;
    }

    private async Task SaveWithImages(AgriculturalListing listing, IReadOnlyCollection<IFormFile> files, CancellationToken ct)
    {
        if (files.Count + listing.ImageUrls.Count > 15 || files.Any(file => file.Length is 0 or > 15728640 ||
            !file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ||
            Path.GetExtension(file.FileName).ToLowerInvariant() is not (".jpg" or ".jpeg" or ".png" or ".webp" or ".gif")))
            throw new BadRequestException("حداکثر ۱۵ تصویر معتبر و هر تصویر تا ۱۵ مگابایت پذیرفته می‌شود.");
        var uploaded = new List<string>();
        try
        {
            foreach (var file in files)
                uploaded.Add((await storage.SaveFileInternalAsync(file, EntityFile.AgriculturalListing, true)).RelativePath);
            listing.ImageUrls.AddRange(uploaded);
            await db.SaveChangesAsync(ct);
        }
        catch
        {
            foreach (var url in uploaded)
                await storage.DeleteFileAsync(url);
            throw;
        }
    }

    private IActionResult Success<T>(T data) => Ok(new ApiResponse<T> { IsSuccess = true, Data = data });
}
