using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Exceptions;

namespace AlooGiyah_Application.Services;

public static class ServiceRequestValidation
{
    // Keep quantities within useful bounds and away from numeric conversion overflow.
    private const double MaximumAmount = 1_000_000_000;

    public static void Validate(ServiceRequest request)
    {
        if (!Enum.IsDefined(request.ServiceType))
            throw new BadRequestException("نوع خدمت معتبر نیست.");
        if (string.IsNullOrWhiteSpace(request.Description) || request.Description.Length > 1000)
            throw new BadRequestException("شرح درخواست همراه با نشانی باید بین ۱ تا ۱۰۰۰ نویسه باشد.");
        var valid = request.ServiceType switch
        {
            ServiceRequestType.Vase => request.NumberOfVases is > 0 and <= 1_000_000_000 &&
                request.GardenArea == null && request.GreenhouseArea == null,
            ServiceRequestType.Garden => PositiveFinite(request.GardenArea) &&
                request.NumberOfVases == null && request.GreenhouseArea == null,
            ServiceRequestType.Greenhouse => PositiveFinite(request.GreenhouseArea) &&
                request.NumberOfVases == null && request.GardenArea == null,
            _ => false
        };
        if (!valid)
            throw new BadRequestException("فقط تعداد یا مساحت مرتبط با نوع خدمت را با مقدار مثبت وارد کنید.");
    }

    private static bool PositiveFinite(double? value) =>
        value.HasValue && double.IsFinite(value.Value) && value.Value > 0 && value.Value <= MaximumAmount;
}
