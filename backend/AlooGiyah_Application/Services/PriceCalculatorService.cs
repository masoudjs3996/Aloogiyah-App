using Microsoft.Extensions.Configuration;
using AlooGiyah_Application.Services.Store;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Shared.Exceptions;

namespace AlooGiyah_Application.Services;

public class PriceCalculatorService : IPriceCalculatorService
{
    #region Constructor
    private readonly IGenericRepository<AgriculturalProduct> _agriculturalProductRepository;
    private readonly IConfiguration _configuration;
    public PriceCalculatorService(IGenericRepository<AgriculturalProduct> agriculturalProductRepository, IConfiguration configuration)
    {
        _agriculturalProductRepository = agriculturalProductRepository;
        _configuration = configuration;
    }
    #endregion

    #region ServiceRequest Pricing
    private const decimal BasePrice = 10000000;       // هزینه پایه
    private const decimal VaseUnitPrice = 500000;    // هر گلدان
    private const decimal GardenUnitPrice = 100000;  // هر متر باغچه
    private const decimal GreenhouseUnitPrice = 50000; // هر متر گلخانه

    public decimal CalculateServiceRequest(ServiceRequest request)
    {
        decimal price = BasePrice;

        switch (request.ServiceType)
        {
            case ServiceRequestType.Vase:
                price += (request.NumberOfVases ?? 0) * VaseUnitPrice;
                break;

            case ServiceRequestType.Garden:
                price += (decimal)(request.GardenArea ?? 0) * GardenUnitPrice;
                break;

            case ServiceRequestType.Greenhouse:
                price += (decimal)(request.GreenhouseArea ?? 0) * GreenhouseUnitPrice;
                break;
        }

        // تخفیف
        if (request.DiscountAmount > 0)
            price -= request.DiscountAmount;

        return price < 0 ? 0 : price;
    }
    #endregion

    #region Order Pricing
    public decimal CalculateOrder(Order order, string? userRole = null)
    {
        decimal totalPrice = 0;

        foreach (var item in order.OrderItems)
        {
            // نقش کاربر تعیین می‌کنه از کدوم قیمت استفاده بشه
            decimal productPrice = userRole == "User"
                ? item.Product.RetailPrice
                : item.Product.WholesalePrice;

            var itemPrice = productPrice * item.Quantity;
            item.Price = itemPrice; // آپدیت قیمت آیتم
            totalPrice += itemPrice;
        }

        decimal discountAmount = 0;
        if (order.Discount != null)
        {
            switch (order.Discount.DiscountType)
            {
                case DiscountType.Percentage:
                    var percentageDiscount = totalPrice * order.Discount.Value / 100;

                    // اگر سقف مبلغ تخفیف تعریف شده باشه، مقدار تخفیف رو محدود می‌کنیم
                    if (order.Discount.MaxDiscountAmount.HasValue)
                        discountAmount = Math.Min(percentageDiscount, order.Discount.MaxDiscountAmount.Value);
                    else
                        discountAmount = percentageDiscount;
                    break;

                case DiscountType.Fixed:
                    discountAmount = order.Discount.Value;
                    break;

                default:
                    discountAmount = 0;
                    break;
            }

            // بررسی تعداد دفعات مجاز استفاده
            if (order.Discount.MaxUsage.HasValue &&
                order.Discount.UsageCount >= order.Discount.MaxUsage.Value)
            {
                discountAmount = 0;
            }
        }

        order.DiscountAmount = discountAmount;
        order.TotalPrice = totalPrice - discountAmount;


        return order.TotalPrice < 0 ? 0 : order.TotalPrice;
    }
    #endregion

    #region AgriculturalOrder Pricing
    public async Task<decimal> CalculateAgriculturalOrder(AgriculturalOrder order, string? userRole = null)
    {
        if (order.CheckoutId.HasValue)
            throw new BadRequestException("قیمت سفارش ثبت‌شده قابل محاسبه مجدد نیست.");
        if (order?.AgriculturalOrderItems == null || !order.AgriculturalOrderItems.Any())
            return 0;

        decimal totalPrice = 0;
        decimal totalDiscountAmount = 0;

        var discount = order.Discount;
        var buyerCode = order.Buyer?.Code;

        // اعتبارسنجی تخفیف
        if (discount != null && !IsDiscountValid(discount, buyerCode))
            discount = null;

        foreach (var item in order.AgriculturalOrderItems)
        {
            var product = await _agriculturalProductRepository.GetByIdAsync(item.AgriculturalProductId);
            if (product == null) continue;

            decimal productPrice = userRole == "User" || userRole == "Gust" ? product.RetailPrice : product.WholesalePrice;
            decimal subtotal = productPrice * item.Quantity;
            item.Price = productPrice;

            decimal itemDiscount = 0;

            if (discount != null && await IsProductEligibleForDiscountAsync(product, discount))
            {
                if (discount.DiscountType == DiscountType.Percentage)
                {
                    itemDiscount = subtotal * discount.Value / 100m;
                    if (discount.MaxDiscountAmount.HasValue)
                        itemDiscount = Math.Min(itemDiscount, discount.MaxDiscountAmount.Value);
                }
                else if (discount.DiscountType == DiscountType.Fixed)
                {
                    itemDiscount = discount.Value * item.Quantity;
                    if (discount.MaxDiscountAmount.HasValue)
                        itemDiscount = Math.Min(itemDiscount, discount.MaxDiscountAmount.Value);
                }
            }

            totalPrice += subtotal;
            totalDiscountAmount += itemDiscount;
        }

        order.TotalPrice = totalPrice;
        order.DiscountAmount = totalDiscountAmount;

        return Math.Max(0, totalPrice - totalDiscountAmount);
    }
    #endregion

    #region Cart Pricing
    public decimal CalculateCart(
     Cart cart,
     string userRole,
     Dictionary<int, bool>? discountEligibility = null)
    {
        if (cart?.CartItems == null || cart.CartItems.Count == 0) return 0;
        var wholesale = _configuration.GetSection("Commerce:WholesaleRoles").GetChildren().Any(x => x.Value == userRole);
        var discount = cart.Discount;
        if (discount != null && (!IsDiscountValid(discount, cart.User?.Code) || discount.Value < 0 ||
            discount.DiscountType == DiscountType.Percentage && discount.Value > 100 || discount.MaxDiscountAmount < 0)) discount = null;
        var eligible = new Dictionary<int, decimal>();
        decimal gross = 0;
        foreach (var group in cart.CartItems.GroupBy(x => x.AgriculturalProduct.FarmId))
        {
            decimal eligibleTotal = 0;
            foreach (var item in group)
            {
                var product = item.AgriculturalProduct;
                var unit = decimal.Round(wholesale ? product.WholesalePrice : product.RetailPrice, 2);
                item.Price = Math.Max(0, unit * item.Quantity); gross += item.Price;
                if (discount != null &&
                    (!discount.FarmId.HasValue || discount.FarmId == product.FarmId) &&
                    (discount.agriculturalProducts == null || discount.agriculturalProducts.Count == 0 || discount.agriculturalProducts.Any(p => p.AgriculturalProductId == product.AgriculturalProductId)) &&
                    (discount.Categories == null || discount.Categories.Count == 0 || product.Categories?.Any(c => discount.Categories.Any(d => d.CategoryId == c.CategoryId)) == true)) eligibleTotal += item.Price;
            }
            eligible[group.Key] = eligibleTotal;
        }
        var totalEligible = eligible.Values.Sum();
        var amount = discount == null ? 0m : discount.DiscountType switch
        {
            DiscountType.Percentage => totalEligible * discount.Value / 100m,
            DiscountType.Fixed => discount.Value,
            _ => 0m
        };
        amount = decimal.Round(Math.Min(totalEligible, Math.Min(amount, discount?.MaxDiscountAmount ?? decimal.MaxValue)), 2);
        cart.DiscountAmount = amount; cart.TotalPrice = Math.Max(0, gross - amount);
        return cart.TotalPrice;
    }

    #endregion

    public async Task<Dictionary<int, bool>> PrepareDiscountEligibilityAsync(
    Cart cart,
    Discount discount)
    {
        var result = new Dictionary<int, bool>();

        if (cart?.CartItems == null || discount == null)
            return result;

        foreach (var item in cart.CartItems)
        {
            var product = item.AgriculturalProduct;
            if (product == null) continue;

            bool eligible = await IsProductEligibleForDiscountAsync(product, discount);
            result[item.AgriculturalProductId] = eligible;
        }

        return result;
    }


    public bool IsDiscountValid(Discount discount, string? buyerCode)
    {
        if (discount == null || !discount.IsActive) return false;
        var now = DateTimeOffset.UtcNow;
        if (discount.StartDate.HasValue && discount.StartDate > now) return false;
        if (discount.EndDate.HasValue && discount.EndDate < now) return false;
        if (discount.MaxUsage.HasValue && discount.UsageCount >= discount.MaxUsage.Value) return false;

        // اگر Users خالی یا null بود → عمومی (همه مجاز)
        var allowedUsers = discount.Users ?? Enumerable.Empty<User>();
        if (allowedUsers.Any() && (buyerCode == null || !allowedUsers.Any(u => u.Code == buyerCode)))
            return false;

        return true;
    }

    // کاملاً امن و درست — دقیقاً طبق خواسته‌ت
    public async Task<bool> IsProductEligibleForDiscountAsync(
     AgriculturalProduct product,
     Discount discount)
    {
        bool noProductLimit = discount.agriculturalProducts == null || !discount.agriculturalProducts.Any();
        bool noCategoryLimit = discount.Categories == null || !discount.Categories.Any();
        bool noFarmLimit = !discount.FarmId.HasValue;

        bool inAllowedProducts =
            discount.agriculturalProducts?.Any(p => p.AgriculturalProductId == product.AgriculturalProductId) == true;

        bool inAllowedCategories =
            product.Categories?.Any(pc =>
                discount.Categories?.Any(dc => dc.CategoryId == pc.CategoryId) == true) == true;

        bool inAllowedFarm =
            discount.FarmId.HasValue && discount.FarmId == product.FarmId;

        return (noProductLimit || inAllowedProducts)
            && (noCategoryLimit || inAllowedCategories)
            && (noFarmLimit || inAllowedFarm);
    }


}
