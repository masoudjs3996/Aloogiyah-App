using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;

namespace AlooGiyah_Application.Interfaces;

public interface IPriceCalculatorService
{
    decimal CalculateServiceRequest(ServiceRequest request);
    decimal CalculateOrder(Order order, string? userRole = null);
    Task<decimal> CalculateAgriculturalOrder(AgriculturalOrder order, string? userRole = null);
    bool IsDiscountValid(Discount discount, string? buyerCode);
    Task<bool> IsProductEligibleForDiscountAsync(AgriculturalProduct product, Discount discount);
    public decimal CalculateCart(
        Cart cart,
        string userRole,
        Dictionary<int, bool>? discountEligibility = null);
    Task<Dictionary<int, bool>> PrepareDiscountEligibilityAsync(
   Cart cart,
   Discount discount);
}
