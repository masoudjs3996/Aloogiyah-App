using AlooGiyah_Application.DTOs.Category;
using AlooGiyah_Application.DTOs.Product;
using AlooGiyah_Application.Interfaces.Store;
using AlooGiyah_Application.Interfaces.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AlooGiyah_Shared.Seo;
using AutoMapper;
using System.Linq.Expressions;


namespace AlooGiyah_Application.Services.Store;

public class ProductService : IProductService
{
    #region Constructor
    private readonly IGenericRepository<Product> _productRepository;
    private readonly IGenericRepository<Category> _categoryRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;


    public ProductService(
        IGenericRepository<Product> productRepository,
        IGenericRepository<Category> categoryRepository,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper
)
    {
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
;
    }
    #endregion


    #region Create
    public async Task<ProductDto> CreateAsync(ProductCreateDto dto)
    {
        if (dto.RetailPrice < 0 || dto.WholesalePrice < 0)
            throw new InvalidOperationException("قیمت نمی‌تواند منفی باشد");

        if (dto.RetailPrice == 0)
            throw new InvalidOperationException("برای مشتری معمولی باید قیمت وارد کنید");

        if (dto.Stock < 0)
            throw new InvalidOperationException("موجودی نمی‌تواند منفی باشد");


        var categories = new List<Category>();
        foreach (var code in dto.CategoryCodes)
        {
            var category = await _categoryRepository.GetByCodeAsync(code);
            if (category == null)
                throw new NotFoundException($"دسته‌بندی با کد {code} پیدا نشد");
            categories.Add(category);
        }

        var roles = _currentUserService.Roles;

        var entity = _mapper.Map<Product>(dto);
        
        entity.Categories = categories;

        entity.MetaTitle = dto.MetaTitle ?? SeoHelper.GenerateMetaTitle(dto.Name);
        entity.MetaDescription = dto.MetaDescription ?? SeoHelper.GenerateMetaDescription(dto.Name);
        entity.MetaKeywords = dto.MetaKeywords ?? SeoHelper.GenerateMetaKeywords(dto.Name);

        // Slug (می‌توانی کنترل یونیک بودن اضافه کنی)
        string baseSlug = SeoHelper.GenerateSlug(entity.MetaTitle);
        string slug = baseSlug;
        int counter = 1;

        while (await _categoryRepository.ExistsAsync(c => c.Slug == slug))
        {
            slug = $"{baseSlug}-{counter}";
            counter++;
        }

        entity.Slug = slug;

        await _productRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        var productDto = _mapper.Map<ProductDto>(entity);
        if (roles.Contains("UserFolder")) // قیمت همکاری برای کاربر با رول یوزر نال ارسال میشود
        {
            productDto.WholesalePrice = null;
        }
        else
        { 
            productDto.WholesalePrice = entity.WholesalePrice;
            productDto.RetailPrice = entity.RetailPrice;
        }
        return productDto;
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(ProductUpdateDto dto)
    {
        var entity = await _productRepository.GetByCodeWithIncludeAsync(
            code: dto.ProductCode,
            includes: new Expression<Func<Product, object>>[] { c => c.Categories });
        if (entity == null) return false;

        if (dto.RetailPrice < 0 || dto.WholesalePrice < 0)
            throw new InvalidOperationException("قیمت نمی‌تواند منفی باشد");

        if (dto.Stock < 0)
            throw new InvalidOperationException("موجودی نمی‌تواند منفی باشد");

        var categories = new List<Category>();
        foreach (var code in dto.CategoryCodes)
        {
            var category = await _categoryRepository.GetByCodeAsync(code);
            if (category == null)
                throw new NotFoundException($"دسته‌بندی با کد {code} پیدا نشد");
            categories.Add(category);
        }

        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.RetailPrice = dto.RetailPrice;
        entity.WholesalePrice = dto.WholesalePrice;
        entity.Stock = dto.Stock;
        entity.Categories = categories;
        entity.MetaTitle = dto.MetaTitle;
        entity.MetaDescription = dto.MetaDescription;
        entity.MetaKeywords = dto.MetaKeywords;

        // Slug (می‌توانی کنترل یونیک بودن اضافه کنی)
        string baseSlug = SeoHelper.GenerateSlug(entity.MetaTitle);
        string slug = baseSlug;
        int counter = 1;

        while (await _categoryRepository.ExistsAsync(c => c.Slug == slug))
        {
            slug = $"{baseSlug}-{counter}";
            counter++;
        }

        entity.Slug = slug;

        await _productRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var entity = await _productRepository.GetByCodeAsync(code);
        if (entity == null) return false;

        await _productRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Get by Code
    public async Task<ProductDto?> GetByCodeAsync(string code)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        var role = _currentUserService.Roles.FirstOrDefault();

        var entity = await _productRepository.GetByCodeWithIncludeAsync(
            code: code,
            includes: new Expression<Func<Product, object>>[] { p => p.Categories });

        if (entity == null) return null;

        var dto = _mapper.Map<ProductDto>(entity);
        dto.CategoryCodes = entity.Categories.Select(c => c.Code).ToList();
        dto.Slug = entity.Slug;
        dto.MetaTitle = entity.MetaTitle;
        dto.MetaDescription = entity.MetaDescription;
        dto.MetaKeywords = entity.MetaKeywords;
        dto.RetailPrice = entity.RetailPrice;
        dto.WholesalePrice = role == "User" ? null : entity.WholesalePrice;

        return dto;
    }
    #endregion

    #region Get by Filter
    public async Task<PagedResult<ProductDto>> GetByFilterAsync(ProductFilterDto filter)
    {
        if (string.IsNullOrEmpty(_currentUserService.UserId))
            throw new ArgumentNullException(nameof(_currentUserService.UserId), "UserFolder ID is required from token.");

        Expression<Func<Product, bool>> predicate = p => !p.IsDeleted;

        var role = _currentUserService.Roles.FirstOrDefault();

        if (!string.IsNullOrEmpty(filter.SearchTerm))
            predicate = predicate.And(p => p.Name.Contains(filter.SearchTerm));


        if (!string.IsNullOrEmpty(filter.CategoryCode))
        {
            var categoryId = await _categoryRepository.GetIdByCodeAsync(filter.CategoryCode, c => c.CategoryId);
            if (categoryId != null)
                predicate = predicate.And(p => p.Categories.Any(cat => cat.CategoryId == categoryId.Value));
        }

        var paged = await _productRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: p => new ProductDto
            {
                Code = p.Code,
                Name = p.Name,
                Description = p.Description,
                Stock = p.Stock,
                RetailPrice = p.RetailPrice,
                WholesalePrice = role == "User" ? null : p.WholesalePrice,
                CategoryCodes = p.Categories.Select(c => c.Code).ToList(),
                Slug = p.Slug,
                MetaTitle = p.MetaTitle,
                MetaDescription = p.MetaDescription,    
                MetaKeywords = p.MetaKeywords,
            },
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: p => p.CreatedAt
        );

        return paged;
    }
    #endregion
}