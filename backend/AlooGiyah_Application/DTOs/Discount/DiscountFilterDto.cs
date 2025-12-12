
using AlooGiyah_Application.DTOs.BaseDto;
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.Discount;

public class DiscountFilterDto : BaseFilterDto
{
    public string? SearchTerm { get; set; }
    public string? CategoryCodes { get; set; }
    public DiscountType? DiscountType { get; set; }
    public bool? IsActive { get; set; }

}