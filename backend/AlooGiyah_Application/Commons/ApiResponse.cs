using System.Text.Json.Serialization;

namespace AlooGiyah_Application.Commons
{
    
    public class ApiResponse<T>
    {
        [JsonPropertyOrder(0)]
        public bool IsSuccess { get; set; } = true;

        /// پیام توضیحی برای کاربر یا توسعه‌دهنده (موفقیت یا خطا)
        [JsonPropertyOrder(1)]
        public string Message { get; set; } = "عملیات با موفقیت انجام شد.";

        /// داده اصلی پاسخ (در صورت موفقیت)
        [JsonPropertyOrder(2)]
        public T? Data { get; set; }

        /// لیست خطاها (فقط در صورت عدم موفقیت)
        [JsonPropertyOrder(3)]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<string>? Errors { get; set; }

        /// <summary>
        /// کد وضعیت داخلی (اختیاری - برای لاگ‌گیری یا دسته‌بندی خطاها)
        /// </summary>
        [JsonPropertyOrder(4)]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? ErrorCode { get; set; }

        // سازنده‌های کاربردی

        public ApiResponse() { }

        public ApiResponse(T data, string message = "عملیات با موفقیت انجام شد.")
        {
            IsSuccess = true;
            Message = message;
            Data = data;
        }

        public ApiResponse(string errorMessage, string? errorCode = null, params string[] additionalErrors)
        {
            IsSuccess = false;
            Message = errorMessage;
            ErrorCode = errorCode;
            Data = default;

            if (additionalErrors?.Length > 0)
            {
                Errors = additionalErrors.ToList();
                Errors.Insert(0, errorMessage); // پیام اصلی اول باشه
            }
            else
            {
                Errors = new List<string> { errorMessage };
            }
        }

        public ApiResponse(Exception ex, string? errorCode = null)
        {
            IsSuccess = false;
            Message = "خطایی در سرور رخ داد.";
            ErrorCode = errorCode ?? "InternalServerError";
            Data = default;
            Errors = new List<string> { ex.Message };

#if DEBUG
            // فقط در حالت دیباگ جزئیات بیشتر بده
            Errors.Add(ex.StackTrace ?? "بدون StackTrace");
#endif
        }
    }

    // نسخه غیرژنتیک برای مواقعی که داده‌ای نداریم (مثل Delete موفق)
    public class ApiResponse : ApiResponse<object>
    {
        public ApiResponse(string message = "عملیات با موفقیت انجام شد.")
        {
            IsSuccess = true;
            Message = message;
            Data = null;
        }

        public ApiResponse(string errorMessage, string? errorCode = null, params string[] additionalErrors)
            : base(errorMessage, errorCode, additionalErrors) { }
    }
}