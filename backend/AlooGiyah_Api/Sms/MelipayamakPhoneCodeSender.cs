using System.Text.Json;
using System.Text.RegularExpressions;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Shared.Exceptions;

namespace AlooGiyah_Api.Sms;

public sealed class MelipayamakPhoneCodeSender(IHttpClientFactory clients, IConfiguration config, ILogger<MelipayamakPhoneCodeSender>? logger = null) : IPhoneCodeSender
{
    public bool IsConfigured => !string.IsNullOrWhiteSpace(config["Sms:Melipayamak:ApiKey"])
        && !string.IsNullOrWhiteSpace(config["Sms:Melipayamak:Username"])
        && config.GetValue<int>("Sms:Melipayamak:BodyId") > 0;

    public async Task SendAsync(string phoneNumber, string firstName, string lastName, string code)
    {
        if (!IsConfigured) throw new BadRequestException("سرویس پیامک پیکربندی نشده است.");
        try
        {
            using var client = clients.CreateClient("phone-otp");
            var key = config["Sms:Melipayamak:ApiKey"]!.Trim();
            var values = new[] { firstName, lastName, code };
            if (values.Any(value => value.Contains(';')))
                throw new BadRequestException("نام و نام خانوادگی نباید شامل علامت نقطه‌ویرگول باشد.");
            using var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["username"] = config["Sms:Melipayamak:Username"]!.Trim(),
                ["password"] = key,
                ["bodyId"] = config.GetValue<int>("Sms:Melipayamak:BodyId").ToString(System.Globalization.CultureInfo.InvariantCulture),
                ["to"] = phoneNumber,
                ["text"] = string.Join(";", values)
            });
            using var response = await client.PostAsync("https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber", content);
            if (!response.IsSuccessStatusCode)
            {
                var detail = await SafeDetailAsync(response, key, phoneNumber, code, firstName, lastName);
                logger?.LogWarning("SMS provider rejected request. HTTP status: {StatusCode}; Detail: {Detail}", (int)response.StatusCode, detail);
                throw new BadRequestException(response.StatusCode switch
                {
                    System.Net.HttpStatusCode.Unauthorized => "سرویس پیامک کلید دسترسی را نپذیرفت (HTTP 401). تنظیمات ملی‌پیامک باید بررسی شود.",
                    System.Net.HttpStatusCode.Forbidden => "دسترسی سرویس پیامک رد شد (HTTP 403). مجوز کلید و محدودیت IP پنل باید بررسی شود.",
                    System.Net.HttpStatusCode.NotFound => "مسیر سرویس پیامک یافت نشد (HTTP 404). آدرس و کلید پنل باید بررسی شود.",
                    System.Net.HttpStatusCode.TooManyRequests => "تعداد درخواست‌های پیامک بیش از حد مجاز است (HTTP 429)؛ کمی بعد دوباره تلاش کنید.",
                    _ => $"ارسال پیامک انجام نشد (HTTP {(int)response.StatusCode})؛ تنظیمات سرویس و گزارش خطا بررسی شود."
                });
            }
            using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            if (json.RootElement.ValueKind != JsonValueKind.Object
                || !json.RootElement.TryGetProperty("RetStatus", out var status)
                || status.ToString() != "1"
                || !json.RootElement.TryGetProperty("Value", out var receipt)
                || !long.TryParse(receipt.ToString(), out var id) || id <= 0)
            {
                var detail = await SafeDetailAsync(response, key, phoneNumber, code, firstName, lastName);
                logger?.LogWarning("SMS provider rejected receipt. HTTP status: {StatusCode}; Detail: {Detail}", (int)response.StatusCode, detail);
                throw new BadRequestException("سامانه پیامک درخواست را نپذیرفت؛ با پشتیبانی تماس بگیرید.");
            }
        }
        catch (Exception error) when (error is HttpRequestException or TaskCanceledException or JsonException)
        {
            // Do not expose the secret URL, provider payload, phone number or OTP in logs/errors.
            throw new BadRequestException("ارتباط با سامانه پیامک برقرار نشد؛ کمی بعد دوباره تلاش کنید.");
        }
    }
    private async Task<string> SafeDetailAsync(HttpResponseMessage response, string key, string phoneNumber, string code, string firstName, string lastName)
    {
                var detail = "No structured error details";
                try
                {
                    using var errorJson = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                    if (errorJson.RootElement.ValueKind == JsonValueKind.Object)
                    {
                        var parts = new List<string>();
                        foreach (var field in new[] { "RetStatus", "Value", "StrRetStatus", "recId", "status", "message", "msg", "error", "errors", "title" })
                            if (errorJson.RootElement.TryGetProperty(field, out var value)) parts.Add(field + ": " + value.ToString());
                        if (parts.Count > 0) detail = string.Join("; ", parts);
                    }
                }
                catch (JsonException) { detail = "Non-JSON error response"; }
                foreach (var secret in new[] { config["Sms:Melipayamak:ApiKey"]!, config["Sms:Melipayamak:Username"]!, key, phoneNumber, code, firstName, lastName }
                    .Where(x => !string.IsNullOrWhiteSpace(x)).OrderByDescending(x => x.Length))
                    detail = detail.Replace(secret, "[redacted]", StringComparison.OrdinalIgnoreCase);
                detail = Regex.Replace(detail, @"https?://[^\s""<>]+", "[url]");
                detail = Regex.Replace(detail, @"\p{Nd}{6,}", "[number]");
                detail = detail.Replace('\r', ' ').Replace('\n', ' ');
                if (detail.Length > 600) detail = detail[..600];
        return detail;
    }

}
