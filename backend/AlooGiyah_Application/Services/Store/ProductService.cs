using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.Category;
using AlooGiyah_Application.DTOs.Product;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
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
    private readonly IProductQuery _readQuery;

    #region Constructor
    private readonly IGenericRepository<Product> _productRepository;
    private readonly IGenericRepository<Category> _categoryRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;


    public ProductService(IProductQuery readQuery,
        
        IGenericRepository<Product> productRepository,
        IGenericRepository<Category> categoryRepository,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork,
        IMapper mapper
)
    {
        _readQuery = readQuery;
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
        if (!roles.Any(role => role is "Buyer" or "Farmer" or "Admin" or "Manager"))
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
        return await _readQuery.GetByCodeAsync(code);
    }
    #endregion

    #region Get by Filter
    public async Task<PagedResult<ProductDto>> GetByFilterAsync(ProductFilterDto filter)
    {
        return await _readQuery.GetByFilterAsync(filter);
    }
    #endregion
}
