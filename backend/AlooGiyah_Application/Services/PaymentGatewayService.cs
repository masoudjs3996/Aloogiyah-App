using AlooGiyah_Application.Interfaces.Service;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;

namespace AlooGiyah_Application.Services;

public class PaymentGatewayService : IPaymentGatewayService
{
    private readonly HttpClient _httpClient;
    private readonly string _gatewayApiKey; // از appsettings.json

    public PaymentGatewayService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _gatewayApiKey = configuration["PaymentGateway:ApiKey"];
    }

    public async Task<string> InitiatePaymentAsync(string transactionId, decimal amount, string? redirectUrl)
    {
        // فرض: فراخوانی API درگاه (مثل زرین‌پال یا ملت)
        var request = new
        {
            TransactionId = transactionId,
            Amount = amount,
            RedirectUrl = redirectUrl ?? "http://yourapp.com/api/Wallet/DepositCallback"
        };

        // فرض: فراخوانی API درگاه
        var response = await _httpClient.PostAsJsonAsync("https://gateway.example.com/api/initiate", request);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException("خطا در ایجاد درخواست پرداخت");

        var result = await response.Content.ReadAsStringAsync();
        return result; // URL درگاه
    }

    public async Task<PaymentStatus> VerifyPaymentAsync(string transactionId)
    {
        // فرض: تأیید پرداخت از درگاه
        var response = await _httpClient.GetAsync($"https://gateway.example.com/api/verify?transactionId={transactionId}");
        if (!response.IsSuccessStatusCode)
            return new PaymentStatus { IsSuccess = false };

        // فرض: پاسخ موفق
        return new PaymentStatus { IsSuccess = true };
    }
}

public class PaymentStatus
{
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
}
