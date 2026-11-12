using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.AgriculturalProductTemplate;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Persistence.Context;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AgriculturalProductTemplateController(AlooGiyahDbContext db) : ControllerBase
{
    [Authorize(Roles = "Admin,Manager")]
    [HttpGet("Icons")]
    public IActionResult Icons() => Ok(new ApiResponse<object>
    {
        IsSuccess = true,
        Data = SpecificationIconCatalog.All.Select(icon => new { icon.Id, icon.Label })
    });

    [AllowAnonymous]
    [HttpGet("Icons/{id}")]
    public IActionResult IconImage(string id)
    {
        var icon = SpecificationIconCatalog.Find(id);
        if (icon == null) return NotFound();
        Response.Headers.CacheControl = "public, max-age=86400";
        return File(icon.Png, "image/png");
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string[] categoryCodes, CancellationToken ct)
    {
        var codes = categoryCodes.Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.Ordinal).ToHashSet(StringComparer.Ordinal);
        var query = db.AgriculturalProductTemplates.AsNoTracking()
            .Where(x => !x.IsDeleted && x.IsActive && !x.Category.IsDeleted)
            .Include(x => x.Category).Include(x => x.Specifications).ThenInclude(x => x.Options)
            .AsQueryable();
        if (codes.Count > 0)
            query = query.Where(x => codes.Contains(x.Category.Code));

        var templates = await query.OrderBy(x => x.SortOrder).ThenBy(x => x.Name).ToListAsync(ct);
        return Ok(new ApiResponse<List<AgriculturalProductTemplateDto>>
        {
            IsSuccess = true,
            Data = templates.Select(x => ToDto(x, activeOnly: true)).ToList()
        });
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpGet("Manage")]
    public async Task<IActionResult> Manage([FromQuery] string? categoryCode, CancellationToken ct)
    {
        var query = db.AgriculturalProductTemplates.AsNoTracking().Where(x => !x.IsDeleted)
            .Include(x => x.Category).Include(x => x.Specifications).ThenInclude(x => x.Options).AsQueryable();
        if (!string.IsNullOrWhiteSpace(categoryCode))
            query = query.Where(x => x.Category.Code == categoryCode);

        var templates = await query.OrderBy(x => x.Category.SortOrder).ThenBy(x => x.SortOrder).ThenBy(x => x.Name)
            .ToListAsync(ct);
        return Ok(new ApiResponse<List<AgriculturalProductTemplateDto>>
        {
            IsSuccess = true,
            Data = templates.Select(x => ToDto(x, activeOnly: false)).ToList()
        });
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create(AgriculturalProductTemplateUpsertDto input, CancellationToken ct)
    {
        Validate(input);
        var category = await db.Categories.SingleOrDefaultAsync(x => x.Code == input.CategoryCode && !x.IsDeleted, ct)
            ?? throw new NotFoundException("دسته‌بندی پیدا نشد.");
        if (await db.AgriculturalProductTemplates.AnyAsync(x => x.CategoryId == category.CategoryId &&
            x.Name == input.Name.Trim() && !x.IsDeleted, ct))
            throw new BadRequestException("نوع محصولی با این نام در دسته‌بندی انتخاب‌شده وجود دارد.");

        var entity = NewTemplate(input, category.CategoryId);
        db.AgriculturalProductTemplates.Add(entity);
        await db.SaveChangesAsync(ct);
        await db.Entry(entity).Reference(x => x.Category).LoadAsync(ct);
        return Ok(new ApiResponse<AgriculturalProductTemplateDto> { IsSuccess = true, Data = ToDto(entity, false) });
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("{code}")]
    public async Task<IActionResult> Update(string code, AgriculturalProductTemplateUpsertDto input, CancellationToken ct)
    {
        Validate(input);
        var entity = await db.AgriculturalProductTemplates.Include(x => x.Category)
            .Include(x => x.Specifications).ThenInclude(x => x.Options)
            .SingleOrDefaultAsync(x => x.Code == code && !x.IsDeleted, ct)
            ?? throw new NotFoundException("نوع محصول پیدا نشد.");
        var category = await db.Categories.SingleOrDefaultAsync(x => x.Code == input.CategoryCode && !x.IsDeleted, ct)
            ?? throw new NotFoundException("دسته‌بندی پیدا نشد.");
        if (entity.CategoryId != category.CategoryId && await db.AgriculturalListings
                .AnyAsync(x => x.AgriculturalProductTemplateId == entity.AgriculturalProductTemplateId && !x.IsDeleted, ct))
            throw new BadRequestException("نوع محصولی که برای آن آگهی ثبت شده است را نمی‌توان به دسته‌بندی دیگری منتقل کرد.");
        if (await db.AgriculturalProductTemplates.AnyAsync(x => x.AgriculturalProductTemplateId != entity.AgriculturalProductTemplateId &&
            x.CategoryId == category.CategoryId && x.Name == input.Name.Trim() && !x.IsDeleted, ct))
            throw new BadRequestException("نوع محصولی با این نام در دسته‌بندی انتخاب‌شده وجود دارد.");

        entity.CategoryId = category.CategoryId;
        entity.Name = input.Name.Trim();
        entity.DefaultSaleUnit = string.IsNullOrEmpty(input.DefaultSaleUnit) ? null : input.DefaultSaleUnit;
        entity.IsActive = input.IsActive;
        entity.SortOrder = input.SortOrder;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        UpdateSpecifications(entity, input.Specifications);
        await db.SaveChangesAsync(ct);
        entity.Category = category;
        return Ok(new ApiResponse<AgriculturalProductTemplateDto> { IsSuccess = true, Data = ToDto(entity, false) });
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("{code}")]
    public async Task<IActionResult> Delete(string code, CancellationToken ct)
    {
        var entity = await db.AgriculturalProductTemplates.SingleOrDefaultAsync(x => x.Code == code && !x.IsDeleted, ct)
            ?? throw new NotFoundException("نوع محصول پیدا نشد.");
        entity.IsDeleted = true;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(new ApiResponse<bool> { IsSuccess = true, Data = true });
    }

    private static AgriculturalProductTemplate NewTemplate(AgriculturalProductTemplateUpsertDto input, int categoryId) => new()
    {
        CategoryId = categoryId,
        Name = input.Name.Trim(),
        DefaultSaleUnit = string.IsNullOrEmpty(input.DefaultSaleUnit) ? null : input.DefaultSaleUnit,
        IsActive = input.IsActive,
        SortOrder = input.SortOrder,
        Specifications = input.Specifications.Select(NewSpecification).ToList()
    };

    private static AgriculturalProductTemplateSpecification NewSpecification(ProductTemplateSpecificationInput input) => new()
    {
        Name = input.Name.Trim(),
        IsRequired = input.IsRequired,
        IsActive = input.IsActive,
        SortOrder = input.SortOrder,
        Options = input.Options.Select(option => new AgriculturalProductTemplateSpecificationOption
        {
            Label = option.Label.Trim(), IsActive = option.IsActive, SortOrder = option.SortOrder,
            ColorHex = string.IsNullOrEmpty(option.ColorHex) ? null : option.ColorHex,
            Icon = string.IsNullOrEmpty(option.Icon) ? null : option.Icon
        }).ToList()
    };

    private static void UpdateSpecifications(AgriculturalProductTemplate entity, IEnumerable<ProductTemplateSpecificationInput> input)
    {
        var fields = input.ToList();
        var byCode = entity.Specifications.ToDictionary(x => x.Code, StringComparer.Ordinal);
        var submitted = fields.Where(x => !string.IsNullOrWhiteSpace(x.Code)).Select(x => x.Code!).ToHashSet(StringComparer.Ordinal);
        foreach (var old in entity.Specifications.Where(x => !x.IsDeleted && !submitted.Contains(x.Code)))
            old.IsActive = false;

        foreach (var item in fields)
        {
            if (string.IsNullOrWhiteSpace(item.Code) || !byCode.TryGetValue(item.Code, out var field))
            {
                entity.Specifications.Add(NewSpecification(item));
                continue;
            }

            field.Name = item.Name.Trim(); field.IsRequired = item.IsRequired; field.IsActive = item.IsActive;
            field.SortOrder = item.SortOrder; field.UpdatedAt = DateTimeOffset.UtcNow;
            var options = field.Options.ToDictionary(x => x.Code, StringComparer.Ordinal);
            var optionCodes = item.Options.Where(x => !string.IsNullOrWhiteSpace(x.Code)).Select(x => x.Code!).ToHashSet(StringComparer.Ordinal);
            foreach (var old in field.Options.Where(x => !x.IsDeleted && !optionCodes.Contains(x.Code))) old.IsActive = false;
            foreach (var option in item.Options)
            {
                if (!string.IsNullOrWhiteSpace(option.Code) && options.TryGetValue(option.Code, out var old))
                {
                    old.Label = option.Label.Trim(); old.IsActive = option.IsActive; old.SortOrder = option.SortOrder;
                    if (option.ColorHex != null) old.ColorHex = option.ColorHex.Length == 0 ? null : option.ColorHex;
                    if (option.Icon != null) old.Icon = option.Icon.Length == 0 ? null : option.Icon;
                    old.UpdatedAt = DateTimeOffset.UtcNow;
                }
                else field.Options.Add(new AgriculturalProductTemplateSpecificationOption
                {
                    Label = option.Label.Trim(), IsActive = option.IsActive, SortOrder = option.SortOrder,
                    ColorHex = string.IsNullOrEmpty(option.ColorHex) ? null : option.ColorHex,
                    Icon = string.IsNullOrEmpty(option.Icon) ? null : option.Icon
                });
            }
        }
    }

    private static void Validate(AgriculturalProductTemplateUpsertDto input)
    {
        if (string.IsNullOrWhiteSpace(input.Name)) throw new BadRequestException("نام نوع محصول را وارد کنید.");
        var names = input.Specifications.Select(x => x.Name.Trim()).ToList();
        if (names.Any(string.IsNullOrWhiteSpace) || names.Distinct(StringComparer.OrdinalIgnoreCase).Count() != names.Count)
            throw new BadRequestException("نام مشخصات باید یکتا باشد.");
        foreach (var specification in input.Specifications)
        {
            if (specification.Options.Any(option => !string.IsNullOrEmpty(option.Icon) && SpecificationIconCatalog.Find(option.Icon) == null))
                throw new BadRequestException("آیکون گزینه را از فهرست آیکون‌ها انتخاب کنید.");
            var options = specification.Options.Select(x => x.Label.Trim()).ToList();
            if (options.Count == 0 || options.Any(string.IsNullOrWhiteSpace) ||
                options.Distinct(StringComparer.OrdinalIgnoreCase).Count() != options.Count)
                throw new BadRequestException($"برای «{specification.Name}» حداقل یک گزینهٔ یکتا وارد کنید.");
            if (input.IsActive && specification.IsActive && specification.IsRequired &&
                !specification.Options.Any(option => option.IsActive))
                throw new BadRequestException($"برای مشخصهٔ اجباری «{specification.Name}» حداقل یک گزینه را فعال بگذارید.");
        }
    }

    private static AgriculturalProductTemplateDto ToDto(AgriculturalProductTemplate x, bool activeOnly) => new()
    {
        Code = x.Code, CategoryCode = x.Category.Code, CategoryName = x.Category.Name,
        Name = x.Name, DefaultSaleUnit = x.DefaultSaleUnit, IsActive = x.IsActive, SortOrder = x.SortOrder,
        Specifications = x.Specifications.Where(s => !s.IsDeleted && (!activeOnly || s.IsActive))
            .OrderBy(s => s.SortOrder).ThenBy(s => s.Name).Select(s => new ProductTemplateSpecificationDto
            {
                Code = s.Code, Name = s.Name, IsRequired = s.IsRequired, IsActive = s.IsActive, SortOrder = s.SortOrder,
                Options = s.Options.Where(o => !o.IsDeleted && (!activeOnly || o.IsActive))
                    .OrderBy(o => o.SortOrder).ThenBy(o => o.Label).Select(o => new ProductTemplateOptionDto
                    {
                        Code = o.Code, Label = o.Label, IsActive = o.IsActive, SortOrder = o.SortOrder,
                        ColorHex = o.ColorHex, Icon = o.Icon
                    }).ToList()
            }).ToList()
    };
}
