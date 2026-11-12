using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Shared.Exceptions;
using Microsoft.EntityFrameworkCore;
namespace AlooGiyah_Application.Services.Store;
public class SavedProductService(IGenericRepository<SavedProduct> savedProducts,
    IGenericRepository<AgriculturalProduct> products, IGenericRepository<Files> files,
    ICurrentUserService currentUser, IUnitOfWork unitOfWork) : ISavedProductService
{
    private int UserId()
    {
        if (!currentUser.IsAuthenticated || currentUser.IsGuest || !int.TryParse(currentUser.UserId, out var id))
            throw new UnauthorizedException("برای ذخیره محصول وارد حساب کاربری شوید.");
        return id;
    }
    public async Task<List<SavedProductDto>> GetAsync()
    {
        var id = UserId();
        var productImages = files.GetAll().AsNoTracking()
            .Where(file => !file.IsDeleted && file.EntityFile == EntityFile.AgriculturalProduct);
        return await savedProducts.GetAll().AsNoTracking().Where(x => x.UserId == id && !x.IsDeleted)
            .OrderByDescending(x => x.CreatedAt).Select(x => new SavedProductDto {
                ProductCode = x.AgriculturalProduct.Code, Name = x.AgriculturalProduct.Name,
                PrimaryImageUrl = productImages.Where(file => file.EntityCode == x.AgriculturalProduct.Code)
                    .OrderByDescending(file => file.IsPrimary).ThenByDescending(file => file.CreatedAt)
                    .ThenByDescending(file => file.FileId).Select(file => file.Url).FirstOrDefault(),
                SaleUnit = x.AgriculturalProduct.SaleUnit, FarmName = x.AgriculturalProduct.Farm.Name, RetailPrice = x.AgriculturalProduct.RetailPrice,
                Stock = x.AgriculturalProduct.Stock,
                IsAvailable = !x.AgriculturalProduct.IsDeleted && !x.AgriculturalProduct.Farm.IsDeleted && x.AgriculturalProduct.Status.Code == "251BC4A57D"
            }).ToListAsync();
    }
    public async Task SetAsync(string productCode, bool saved)
    {
        var id = UserId();
        await using var tx = await unitOfWork.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var product = await products.GetAllIncludingDeleted().SingleOrDefaultAsync(x => x.Code == productCode)
            ?? throw new NotFoundException("محصول یافت نشد.");
        var existing = await savedProducts.GetAllIncludingDeleted().SingleOrDefaultAsync(x => x.UserId == id && x.AgriculturalProductId == product.AgriculturalProductId);
        if (existing != null && !saved) await savedProducts.DeleteAsync(existing);
        else if (existing == null && saved) { if (product.IsDeleted) throw new NotFoundException("محصول در دسترس نیست."); await savedProducts.AddAsync(new SavedProduct { UserId = id, AgriculturalProductId = product.AgriculturalProductId }); }
        await unitOfWork.SaveChangesAsync();
        await tx.CommitAsync();
    }
}
