using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using AlooGiyah_Shared.Exceptions;

namespace AlooGiyah_Application.DTOs.QualityAssessment;

public sealed class QualityReportDto
{
    [Required, RegularExpression("^(تأیید|تأیید مشروط|عدم تأیید)$")]
    public string Result { get; set; } = "";
    [Required, RegularExpression("^(سالم|نیازمند رسیدگی|آسیب‌دیده|قابل ارزیابی نیست)$")]
    public string Health { get; set; } = "";
    [Required, RegularExpression("^(تازه|متوسط|کاهش تازگی|قابل ارزیابی نیست)$")]
    public string Freshness { get; set; } = "";
    [Required, RegularExpression("^(یکنواخت|نسبتاً یکنواخت|ناهمگون|قابل ارزیابی نیست)$")]
    public string Uniformity { get; set; } = "";
    [Required, Range(typeof(decimal), "0", "100")]
    public decimal? DamagePercent { get; set; }
    [Required, Range(typeof(decimal), "0.001", "100000000")]
    public decimal? InspectedQuantity { get; set; }
    [Required, RegularExpression("^(کیلوگرم|شاخه|عدد|بسته|لیتر)$")]
    public string QuantityUnit { get; set; } = "";

    public string ToValidatedJson(string grade)
    {
        var errors = new List<ValidationResult>();
        if (!Validator.TryValidateObject(this, new ValidationContext(this), errors, true) ||
            grade is not ("ممتاز" or "درجه یک" or "درجه دو" or "درجه سه" or "غیرقابل عرضه"))
            throw new BadRequestException("گزینه‌های گزارش، درجه کیفیت و مقدار بررسی‌شده را درست تکمیل کنید.");
        return JsonSerializer.Serialize(this);
    }

    public static QualityReportDto? FromJson(string? value) => string.IsNullOrWhiteSpace(value) ? null : JsonSerializer.Deserialize<QualityReportDto>(value);
}
