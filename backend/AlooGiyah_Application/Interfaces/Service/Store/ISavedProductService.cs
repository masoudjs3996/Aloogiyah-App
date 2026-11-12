using AlooGiyah_Application.DTOs.AgriculturalProduct;
namespace AlooGiyah_Application.Interfaces.Service.Store;
public interface ISavedProductService
{
    Task<List<SavedProductDto>> GetAsync();
    Task SetAsync(string productCode, bool saved);
}
