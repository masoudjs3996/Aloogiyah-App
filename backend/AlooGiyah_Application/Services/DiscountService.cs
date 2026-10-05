using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.Discount;
using AlooGiyah_Application.Interfaces.Service;
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
    private readonly IDiscountQuery _readQuery;


    #region Constractor
    private readonly IGenericRepository<Discount> _discountRepository;
    private readonly IGenericRepository<User> _userRepository;
    private readonly IGenericRepository<AgriculturalProduct> _agriculturalProductRepository;
    private readonly IGenericRepository<Category> _categoryRepository;
    private readonly IGenericRepository<Farm> _farmRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public DiscountService(IDiscountQuery readQuery,
        
        IGenericRepository<Discount> discountRepository,
        IGenericRepository<User> userRepository,
        IGenericRepository<AgriculturalProduct> agriculturalProductRepository,
        IGenericRepository<Category> categoryRepository,
        IGenericRepository<Farm> farmRepository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _readQuery = readQuery;
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
        return await _readQuery.GetByCodeAsync(code);
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<DiscountDto>> GetByFilterAsync(DiscountFilterDto filter)
    {
        return await _readQuery.GetByFilterAsync(filter);
    }
    #endregion
}



