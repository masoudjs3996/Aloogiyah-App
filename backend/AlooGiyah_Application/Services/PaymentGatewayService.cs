using AlooGiyah_Application.Interfaces.Service;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;

namespace AlooGiyah_Application.Services;

public class PaymentGatewayService : IPaymentGatewayService
{
    private readonly HttpClient _httpClient;
    private readonly string? _gatewayApiKey; // از appsettings.json

    public PaymentGatewayService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _gatewayApiKey = configuration["PaymentGateway:ApiKey"];
    }

    public async Task<string> InitiatePaymentAsync(string transactionId, decimal amount, string? redirectUrl)
    {
        await Task.CompletedTask;
        throw new AlooGiyah_Shared.Exceptions.BadRequestException(
            "درگاه آنلاین هنوز به ارائه‌دهنده واقعی متصل نشده است.");
    }

    public async Task<PaymentStatus> VerifyPaymentAsync(string transactionId)
    {
        await Task.CompletedTask;
        return new PaymentStatus { IsSuccess = false,
            ErrorMessage = "درگاه واقعی پیکربندی نشده است؛ پرداخت تأیید نشد." };
    }
}

public class PaymentStatus
{
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
}
