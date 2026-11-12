using AlooGiyah_Application.DTOs.ProductInquiry;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Service.Store;

public interface IProductInquiryService
{
    Task<ProductInquiryDto> CreateAsync(ProductInquiryCreateDto dto);
    Task<PagedResult<ProductInquiryDto>> GetMineAsync(string role, string filter, int page, int pageSize);
    Task<ProductInquiryDto> ActAsync(string code, ProductInquiryActionDto dto);
}
