using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Api.Controllers;

[ApiController, Route("api/[controller]"), Authorize(Policy = "NotGuest")]
public sealed class SavedListingsController(AlooGiyahDbContext db, ICurrentUserService actor) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        if (!int.TryParse(actor.UserId, out var userId)) return Unauthorized();
        var items = await db.SavedListings.AsNoTracking().Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt).Select(x => new SavedProductDto
            {
                ProductCode = x.Listing.Code, Name = x.Listing.Name,
                PrimaryImageUrl = x.Listing.ImageUrls.FirstOrDefault(),
                SaleUnit = x.Listing.SaleUnit, FarmName = x.Listing.Farm.Name,
                RetailPrice = x.Listing.RetailPrice, Stock = x.Listing.Stock,
                IsAvailable = !x.Listing.IsDeleted && !x.Listing.Farm.IsDeleted && x.Listing.IsPublished
            }).ToListAsync(ct);
        return Ok(new ApiResponse<List<SavedProductDto>> { IsSuccess = true, Data = items });
    }

    [HttpPut("{code}"), HttpDelete("{code}")]
    public async Task<IActionResult> Set(string code, CancellationToken ct)
    {
        if (!int.TryParse(actor.UserId, out var userId)) return Unauthorized();
        var listing = await db.AgriculturalListings.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Code == code || x.LegacyProductCode == code, ct);
        if (listing is null) return NotFound();
        if (HttpMethods.IsDelete(Request.Method))
            await db.SavedListings.Where(x => x.UserId == userId && x.ListingId == listing.AgriculturalListingId)
                .ExecuteDeleteAsync(ct);
        else
        {
            if (listing.IsDeleted || !listing.IsPublished) return NotFound();
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "SavedListings" ("UserId", "ListingId", "CreatedAt")
                VALUES ({userId}, {listing.AgriculturalListingId}, {DateTimeOffset.UtcNow})
                ON CONFLICT DO NOTHING
                """, ct);
        }
        return Ok(new ApiResponse<bool> { IsSuccess = true, Data = true });
    }
}
