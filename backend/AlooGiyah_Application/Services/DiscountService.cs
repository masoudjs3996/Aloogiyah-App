using AlooGiyah_Application.DTOs.Discount;
using AlooGiyah_Application.Interfaces;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Commons;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;
using System.Linq.Expressions;

namespace AlooGiyah_Application.Services;

public class DiscountService : IDiscountService
{

    #region Constractor
    private readonly IGenericRepository<Discount> _discountRepository;
    private readonly IGenericRepository<User> _userRepository;
    private readonly IGenericRepository<AgriculturalProduct> _agriculturalProductRepository;
    private readonly IGenericRepository<Category> _categoryRepository;
    private readonly IGenericRepository<Farm> _farmRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public DiscountService(
        IGenericRepository<Discount> discountRepository,
        IGenericRepository<User> userRepository,
        IGenericRepository<AgriculturalProduct> agriculturalProductRepository,
        IGenericRepository<Category> categoryRepository,
        IGenericRepository<Farm> farmRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _discountRepository = discountRepository;
        _userRepository = userRepository;
        _agriculturalProductRepository = agriculturalProductRepository;
        _categoryRepository = categoryRepository;
        _farmRepository = farmRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    #endregion


    #region Create
    public async Task<DiscountDto> CreateAsync(DiscountCreateDto dto)
    {
        // کاربران
        var validUserCodes = dto.UserCodes?.Where(c => !string.IsNullOrWhiteSpace(c))
                                          ?? Enumerable.Empty<string>();
        var users = new List<User>();
        foreach (var code in validUserCodes)
        {
            var user = await _userRepository.GetByCodeAsync(code.Trim())
                       ?? throw new NotFoundException($"کاربر با کد '{code}' پیدا نشد");
            users.Add(user);
        }

        // محصولات
        var validProductCodes = dto.ProductCodes?.Where(c => !string.IsNullOrWhiteSpace(c))
                                                ?? Enumerable.Empty<string>();
        var agroProducts = new List<AgriculturalProduct>();
        foreach (var code in validProductCodes)
        {
            var product = await _agriculturalProductRepository.GetByCodeAsync(code.Trim())
                          ?? throw new NotFoundException($"محصول با کد '{code}' پیدا نشد");
            agroProducts.Add(product);
        }

        // دسته‌بندی‌ها
        var validCategoryCodes = dto.CategoryCodes?.Where(c => !string.IsNullOrWhiteSpace(c))
                                                  ?? Enumerable.Empty<string>();
        var categories = new List<Category>();

        foreach (var code in validCategoryCodes)
        {
            var cat = await _categoryRepository.GetByCodeAsync(code.Trim())
                      ?? throw new NotFoundException($"دسته‌بندی با کد '{code}' پیدا نشد");
            categories.Add(cat);
        }

        // مزرعه
        int? farmId = null;
        if (!string.IsNullOrWhiteSpace(dto.FarmCode))
        {
            var farm = await _farmRepository.GetByCodeAsync(dto.FarmCode.Trim())
                       ?? throw new NotFoundException($"مزرعه با کد '{dto.FarmCode}' پیدا نشد");
            farmId = farm.FarmId;
        }
        var entity = _mapper.Map<Discount>(dto);
        entity.Users = users;
        entity.agriculturalProducts = agroProducts;
        entity.Categories = categories;

        await _discountRepository.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        var discountDto = _mapper.Map<DiscountDto>(entity);
        discountDto.UserCodes = users.Select(x => x.Code).ToList();
        discountDto.ProductCodes = agroProducts.Select(x => x.Code).ToList();
        discountDto.CategoryCodes = categories.Select(x => x.Code).ToList();


        return discountDto;
    }
    #endregion

    #region Update
    public async Task<bool> UpdateAsync(DiscountUpdateDto dto)
    {
        var entity = await _discountRepository.GetByCodeAsync(dto.Code);
        if (entity == null)
            return false;

        // گرفتن کاربران مجاز
        var users = new List<User>();
        foreach (var userCode in dto.UserCodes)
        {
            var user = await _userRepository.GetByCodeAsync(userCode);
            if (user == null)
                throw new NotFoundException($"کاربر با کد {userCode} پیدا نشد");
            users.Add(user);
        }

        // گرفتن محصولات مجاز
        var ageoProducts = new List<AgriculturalProduct>();
        foreach (var productCode in dto.ProductCodes)
        {
            var product = await _agriculturalProductRepository.GetByCodeAsync(productCode);
            if (product == null)
                throw new NotFoundException($"محصول با کد {productCode} پیدا نشد");
            ageoProducts.Add(product);
        }

        entity.DiscountType = dto.DiscountType;
        entity.Value = dto.Value;
        entity.StartDate = dto.StartDate;
        entity.EndDate = dto.EndDate;
        entity.MaxUsage = dto.MaxUsage;
        entity.IsActive = dto.IsActive;
        entity.UsageCount = dto.UsageCount;
        entity.Users = users;
        entity.agriculturalProducts = ageoProducts;

        await _discountRepository.UpdateAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Delete
    public async Task<bool> DeleteAsync(string code)
    {
        var entity = await _discountRepository.GetByCodeAsync(code);
        if (entity == null)
            return false;

        await _discountRepository.DeleteAsync(entity);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
    #endregion

    #region Get By Code
    public async Task<DiscountDto?> GetByCodeAsync(string code)
    {
        var entity = await _discountRepository.GetByCodeWithIncludeAsync(
         code,
         "Users",
         "Products",
         "Categories.ParentCategory",
         "Farm"
     );

        if (entity == null)
            return null;

       
        return _mapper.Map<DiscountDto>(entity);
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<DiscountDto>> GetByFilterAsync(DiscountFilterDto filter)
    {
        Expression<Func<Discount, bool>> predicate = d => !d.IsDeleted;

        if (!string.IsNullOrEmpty(filter.SearchTerm))
            predicate = predicate.And(d => d.Code.Contains(filter.SearchTerm));

        if (filter.CategoryCodes?.Any() ?? false)
            predicate = predicate.And(p => p.Categories.Any(c => filter.CategoryCodes.Contains(c.Code)));


        if (filter.DiscountType.HasValue)
            predicate = predicate.And(d => d.DiscountType == filter.DiscountType);

        if (filter.IsActive.HasValue)
            predicate = predicate.And(d => d.IsActive == filter.IsActive.Value);

        return await _discountRepository.GetPagedProjectedAsync(
            filter: predicate,
            selector: d => _mapper.Map<DiscountDto>(d),
            includes: new string[]
        {
            "Users",
            "Products",
            "Categories.ParentCategory",
            "Farm"
        },
            pageNumber: filter.PageNumber,
            pageSize: filter.PageSize,
            orderBy: d => d.CreatedAt
        );
    }
    #endregion
}



