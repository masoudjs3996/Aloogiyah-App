using AlooGiyah_Application.DTOs.Discount;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlooGiyah_Application.Utils
{
    public static class DiscountExtensions
    {
        public static string GetDiscountDescription(this Discount discount)
        {
            if (discount == null) return "تخفیف نامشخص";

            var parts = new List<string>();

            // نوع و مقدار تخفیف
            string discountText = discount.DiscountType == DiscountType.Percentage
                ? $"{discount.Value}% تخفیف"
                : $"{discount.Value:N0} تومان تخفیف";

            parts.Add(discountText);

            // سقف تخفیف
            if (discount.DiscountType == DiscountType.Percentage &&
                discount.MaxDiscountAmount.HasValue && discount.MaxDiscountAmount > 0)
            {
                parts.Add($"تا سقف {discount.MaxDiscountAmount.Value:N0} تومان");
            }

            // محدودیت‌ها
            var limits = new List<string>();

            if (!string.IsNullOrEmpty(discount.Farm?.Name))
                limits.Add($"مزرعه {discount.Farm.Name}");

            if (discount.Products?.Any() == true)
                limits.Add($"{discount.Products.Count} محصول");

            if (discount.Categories?.Any() == true)
            {
                var names = discount.Categories.Select(c => c.Name).Take(3);
                limits.Add($"دسته {string.Join("، ", names)}" + (discount.Categories.Count > 3 ? " و ..." : ""));
            }

            if (discount.Users?.Any() == true)
                limits.Add("کاربران ویژه");

            if (limits.Any())
                parts.Add("برای " + string.Join("، ", limits));

            // تاریخ
            var dateText = new List<string>();
            if (discount.StartDate.HasValue)
                dateText.Add($"از {discount.StartDate.Value:yyyy/MM/dd}");
            if (discount.EndDate.HasValue)
                dateText.Add($"تا {discount.EndDate.Value:yyyy/MM/dd}");

            if (dateText.Any())
                parts.Add($"({string.Join(" ", dateText)})");

            // تعداد باقی‌مانده
            if (discount.MaxUsage.HasValue && discount.MaxUsage > 0)
            {
                var remaining = discount.MaxUsage.Value - discount.UsageCount;
                if (remaining > 0 && remaining <= 10)
                    parts.Add($"(فقط {remaining} نفر باقی مانده!)");
            }

            return string.Join(" ", parts);
        }

        public static string GetDiscountDescription(this DiscountDto dto)
        {
            if (dto == null) return "تخفیف نامشخص";

            var parts = new List<string>();

            string discountText = dto.DiscountType == DiscountType.Percentage
                ? $"{dto.Value}% تخفیف"
                : $"{dto.Value:N0} تومان تخفیف";

            parts.Add(discountText);

            if (dto.DiscountType == DiscountType.Percentage && dto.MaxDiscountAmount > 0)
                parts.Add($"تا سقف {dto.MaxDiscountAmount:N0} تومان");

            var limits = new List<string>();

            if (dto.FarmCode?.Any() == true) limits.Add("مزرعه خاص");
            if (dto.ProductCodes?.Any() == true) limits.Add($"{dto.ProductCodes.Count} محصول");
            if (dto.CategoryCodes?.Any() == true) limits.Add("دسته‌بندی خاص");
            if (dto.UserCodes?.Any() == true) limits.Add("کاربران ویژه");

            if (limits.Any())
                parts.Add("برای " + string.Join("، ", limits));

            if (dto.EndDate.HasValue)
                parts.Add($"(تا {dto.EndDate.Value:yyyy/MM/dd})");

            if (dto.MaxUsage.HasValue && dto.MaxUsage > 0)
            {
                var remaining = dto.MaxUsage.Value - dto.UsageCount;
                if (remaining > 0 && remaining <= 10)
                    parts.Add($"(فقط {remaining} نفر باقی مانده!)");
            }

            return string.Join(" ", parts);
        }
    }
}
