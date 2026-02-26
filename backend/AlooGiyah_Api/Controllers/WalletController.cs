using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Wallet;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Application.Services.UserFolder;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WalletController : ControllerBase
    {
        private readonly IWalletService _walletService;
        public WalletController(IWalletService walletService)
        {
            _walletService = walletService;
        }
        [Authorize]
        [HttpGet("MyWallet")]
        public async Task<IActionResult> GetMyWallet()
        {
            var wallet = await _walletService.GetWalletByUserCodeAsync();
            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "اطلاعات کیف پول",
                Data = wallet
            });
        }
        [Authorize]
        [HttpPost("Deposit")]
        public async Task<IActionResult> Deposit([FromBody] DepositWalletDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiResponse<object> { IsSuccess = false, Message = "داده‌های ورودی نامعتبر است" });


            var result = await _walletService.DepositAsync(dto.Amount, dto.RedirectUrl);

            return Ok(new ApiResponse<DepositResultDto>
            {
                IsSuccess = true,
                Message = "درخواست شارژ ثبت شد. لطفاً به درگاه پرداخت هدایت شوید.",
                Data = result
            });
        }

        [AllowAnonymous] // چون از درگاه پرداخت فراخوانی می‌شه
        [HttpGet("DepositCallback")]
        public async Task<IActionResult> DepositCallback([FromQuery] string transactionId)
        {
            try
            {
                var result = await _walletService.ConfirmDepositAsync(transactionId);
                if (!result)
                    return BadRequest(new ApiResponse<object> { IsSuccess = false, Message = "تأیید پرداخت ناموفق بود" });

                return Ok(new ApiResponse<object>
                {
                    IsSuccess = true,
                    Message = "شارژ کیف پول با موفقیت انجام شد",
                    Data = new { TransactionId = transactionId }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<object> { IsSuccess = false, Message = ex.Message });
            }
        }
    }
}
