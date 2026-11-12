using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Application.DTOs.AgriculturalOrderItem;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Exceptions;
using Microsoft.EntityFrameworkCore;
namespace AlooGiyah_Application.Services.Store;
public class AgriculturalOrderItemService : IAgriculturalOrderItemService
{
    private readonly IAgriculturalOrderItemQuery _readQuery;

    private readonly IAgriculturalOrderService _orders;
    private readonly IGenericRepository<AgriculturalOrderItem> _items;
    public AgriculturalOrderItemService(IAgriculturalOrderItemQuery readQuery,
        IAgriculturalOrderService orders, IGenericRepository<AgriculturalOrderItem> items)
    {
        _readQuery = readQuery; _orders = orders; _items = items; }
    public Task<AgriculturalOrderItemDto> CreateAsync(AgriculturalOrderItemCreateDto dto, string orderCode) =>
        throw new BadRequestException("آیتم سفارش ثابت است؛ سبد خرید را تغییر دهید.");
    public Task<bool> UpdateAsync(AgriculturalOrderItemUpdateDto dto) =>
        throw new BadRequestException("آیتم سفارش قابل ویرایش نیست.");
    public Task<bool> DeleteAsync(string code) => throw new BadRequestException("آیتم سفارش قابل حذف نیست.");
    public async Task<AgriculturalOrderItemDto?> GetByCodeAsync(string code)
    {
        return await _readQuery.GetByCodeAsync(code);
    }
    public async Task<PagedResult<AgriculturalOrderItemDto>> GetByFilterAsync(AgriculturalOrderItemFilterDto filter)
    {
        return await _readQuery.GetByFilterAsync(filter);
    }
}
