
namespace AlooGiyah_Application.DTOs.AgriculturalOrder;

public class PaymentResultDto
{
    public bool Success { get; set; }
    public string Method { get; set; } = string.Empty; // Wallet | Online
    public string? PaymentUrl { get; set; }
    public string? TransactionId { get; set; }
    public string Message { get; set; } = string.Empty;
}
