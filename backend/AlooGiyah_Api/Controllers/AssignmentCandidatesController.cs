using System.ComponentModel.DataAnnotations;
using AlooGiyah_Application.Commons;
using AlooGiyah_Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Api.Controllers;

[ApiController]
[Route("api/Admin/AssignmentCandidates")]
[Authorize(Roles = "Admin,Manager")]
public class AssignmentCandidatesController(AlooGiyahDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] AssignmentCandidatesFilter filter, CancellationToken cancellationToken)
    {
        if (filter.Kind is not ("ServiceRequest" or "QualityAssessment"))
            return BadRequest(new { message = "نوع درخواست معتبر نیست" });
        if (filter.Scope is not ("all" or "province" or "county"))
            return BadRequest(new { message = "محدوده جغرافیایی معتبر نیست" });

        int? addressId;
        string? assignedCode;
        if (filter.Kind == "ServiceRequest")
        {
            var target = await db.ServiceRequests.AsNoTracking().Where(x => !x.IsDeleted && x.Code == filter.Code)
                .Select(x => new { x.AddressId, AssignedCode = x.Provider == null ? null : x.Provider.Code }).SingleOrDefaultAsync(cancellationToken);
            if (target == null) return NotFound(new { message = "درخواست خدمت یافت نشد" });
            addressId = target.AddressId;
            assignedCode = target.AssignedCode;
        }
        else
        {
            var target = await db.QualityAssessments.AsNoTracking()
                .Where(x => !x.IsDeleted && x.Code == filter.Code && !x.AgriculturalProduct.IsDeleted && !x.AgriculturalProduct.Farm.IsDeleted)
                .Select(x => new { x.AgriculturalProduct.Farm.AddressId, AssignedCode = x.Expert == null ? null : x.Expert.Code }).SingleOrDefaultAsync(cancellationToken);
            if (target == null) return NotFound(new { message = "درخواست ارزیابی یا گلخانه محصول یافت نشد" });
            addressId = target.AddressId;
            assignedCode = target.AssignedCode;
        }

        var destination = await db.Addresses.AsNoTracking().Where(x => x.AddressId == addressId && !x.IsDeleted)
            .Select(x => new AssignmentLocation {
                Code = x.Code, ProvinceId = x.ProvinceId, CountyId = x.CountyId, CityId = x.CityId, VillageId = x.VillageId,
                Province = x.Province.Name, County = x.County.Name, City = x.City == null ? null : x.City.Name,
                Village = x.Village == null ? null : x.Village.Name, Street = x.Street,
                Latitude = x.Latitude, Longitude = x.Longitude, IsDefault = x.IsDefault
            }).SingleOrDefaultAsync(cancellationToken);
        if (filter.Scope != "all" && destination == null)
            return BadRequest(new { message = "نشانی مقصد ثبت نشده است؛ محدوده را روی همه مناطق بگذارید" });
        if (filter.RadiusKm.HasValue && destination?.HasCoordinates != true)
            return BadRequest(new { message = "برای فیلتر شعاع، مختصات مقصد باید ثبت شود" });

        var role = filter.Kind == "ServiceRequest" ? "Provider" : "Expert";
        var users = db.Users.AsNoTracking().Where(x => !x.IsDeleted &&
            ((!x.Role.IsDeleted && x.Role.Name == role) || x.AdditionalRoles.Any(r => !r.IsDeleted && !r.Role.IsDeleted && r.Role.Name == role)));
        var search = filter.Search?.Trim();
        if (!string.IsNullOrWhiteSpace(search))
            users = users.Where(x => x.FName.Contains(search) || (x.LName != null && x.LName.Contains(search)) ||
                (x.FName + " " + (x.LName ?? "")).Contains(search) || x.UserName.Contains(search) || x.PhoneNumber.Contains(search) || x.Code == search);

        // Select one authoritative base per user: default address, then oldest address as an explicit fallback.
        // No location is inferred from another user's address or from a centroid.
        var candidates = await users.Select(x => new {
            x.Code, FullName = x.FName + " " + (x.LName ?? ""), x.UserName, x.PhoneNumber,
            Address = x.Addresses.Where(a => !a.IsDeleted).OrderByDescending(a => a.IsDefault).ThenBy(a => a.AddressId)
                .Select(a => new AssignmentLocation {
                    Code = a.Code, ProvinceId = a.ProvinceId, CountyId = a.CountyId, CityId = a.CityId, VillageId = a.VillageId,
                    Province = a.Province.Name, County = a.County.Name, City = a.City == null ? null : a.City.Name,
                    Village = a.Village == null ? null : a.Village.Name, Street = a.Street,
                    Latitude = a.Latitude, Longitude = a.Longitude, IsDefault = a.IsDefault
                }).FirstOrDefault()
        }).ToListAsync(cancellationToken);

        var ranked = candidates.Select(x => new {
            x.Code, FullName = x.FullName.Trim(), x.UserName, x.PhoneNumber, x.Address,
            DistanceKm = destination?.DistanceTo(x.Address), RegionRank = destination?.RegionRank(x.Address) ?? 4,
            IsAssigned = x.Code == assignedCode
        }).Where(x => (!filter.OnlyLocated || x.Address?.HasCoordinates == true) &&
            (filter.Scope != "province" || x.Address?.ProvinceId == destination!.ProvinceId) &&
            (filter.Scope != "county" || x.Address?.CountyId == destination!.CountyId) &&
            (!filter.RadiusKm.HasValue || (x.DistanceKm.HasValue && x.DistanceKm <= filter.RadiusKm.Value)))
            .OrderBy(x => x.DistanceKm.HasValue ? 0 : 1).ThenBy(x => x.DistanceKm).ThenBy(x => x.RegionRank).ThenBy(x => x.Code)
            .ToList();
        return Ok(new ApiResponse<object> { IsSuccess = true, Data = new {
            Destination = destination, DestinationLabel = filter.Kind == "ServiceRequest" ? "نشانی مراجعه درخواست" : "نشانی گلخانه محصول",
            AssignedCode = assignedCode, Role = role, TotalCount = ranked.Count, filter.PageNumber, filter.PageSize,
            Items = ranked.Skip((filter.PageNumber - 1) * filter.PageSize).Take(filter.PageSize).ToList()
        }});
    }
}

public sealed class AssignmentCandidatesFilter
{
    [Required] public string Kind { get; set; } = "";
    [Required, MaxLength(10)] public string Code { get; set; } = "";
    [MaxLength(100)] public string? Search { get; set; }
    public string Scope { get; set; } = "all";
    [Range(0.1, 20000)] public double? RadiusKm { get; set; }
    public bool OnlyLocated { get; set; }
    [Range(1, 100000)] public int PageNumber { get; set; } = 1;
    [Range(1, 100)] public int PageSize { get; set; } = 20;
}
