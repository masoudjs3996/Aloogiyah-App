using AlooGiyah_Application.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AlooGiyah_Application.Interfaces.Service
{
    public interface IPaymentGatewayService
    {
        bool IsAvailable => false;
        string ProviderName => "None";
        Task<string> InitiatePaymentAsync(string transactionId, decimal amount, string? redirectUrl);
        Task<PaymentStatus> VerifyPaymentAsync(string transactionId, decimal expectedAmountToman);
    }
}
