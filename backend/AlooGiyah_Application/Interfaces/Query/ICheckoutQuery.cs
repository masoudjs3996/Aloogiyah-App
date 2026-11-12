using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface ICheckoutQuery
{
    Task<CheckoutDto?> GetByCodeAsync(string code);
}
