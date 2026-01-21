using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Cart;
using AlooGiyah_Application.Interfaces.Store;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AlooGiyah_Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CartController(ICartService cartService, IHttpContextAccessor httpContextAccessor)
        {
            _cartService = cartService;
            _httpContextAccessor = httpContextAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            try
            {
                var cart = await _cartService.GetCartAsync();

                //// اگر توکن مهمان جدید ساخته شد، در هدر برگردون
                //var response = _httpContextAccessor.HttpContext?.Response;
                //if (response != null && response.Headers.ContainsKey("X-Guest-Token"))
                //{
                //    // هدر قبلاً اضافه شده
                //}

                return Ok(new ApiResponse<CartDto>
                {
                    IsSuccess = true,
                    Message = "سبد خرید با موفقیت دریافت شد",
                    Data = cart
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    IsSuccess = false,
                    Message = ex.Message
                });
            }
        }

        [HttpPost("Add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto dto)
        {
            if (!ModelState.IsValid || dto.Quantity <= 0)
            {
                return BadRequest(new ApiResponse<object>
                {
                    IsSuccess = false,
                    Message = "داده‌های ورودی نامعتبر است."
                });
            }

            var result = await _cartService.AddToCartAsync(dto);

            return Ok(new ApiResponse<CartDto>
            {
                IsSuccess = true,
                Message = "محصول با موفقیت به سبد اضافه شد",
                Data = result
            });
        }

        [HttpPut("UpdateItem")]
        public async Task<IActionResult> UpdateCartItem([FromBody] UpdateCartItemDto dto)
        {
            if (!ModelState.IsValid || dto.Quantity <= 0)
            {
                return BadRequest(new ApiResponse<object> { IsSuccess = false, Message = "داده‌های ورودی نامعتبر است." });
            }

            var result = await _cartService.UpdateCartItemAsync(dto);
            return Ok(new ApiResponse<CartDto>
            {
                IsSuccess = true,
                Message = "آیتم با موفقیت بروزرسانی شد",
                Data = result
            });
        }

        [HttpDelete("RemoveItem")]
        public async Task<IActionResult> RemoveCartItem([FromBody] RemoveCartItemDto dto) // بهتر از FromBody استفاده کن
        {
            if (string.IsNullOrEmpty(dto.ItemCode))
            {
                return BadRequest(new ApiResponse<object> { IsSuccess = false, Message = "کد آیتم الزامی است." });
            }

            var result = await _cartService.RemoveCartItemAsync(dto);
            return Ok(new ApiResponse<CartDto>
            {
                IsSuccess = true,
                Message = "آیتم با موفقیت حذف شد",
                Data = result
            });
        }
        [Authorize] 
        [HttpPost("Merge")]
        public async Task<IActionResult> MergeGuestCart()
        {
            // 1️⃣ گرفتن UserId از JWT
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            // 2️⃣ گرفتن CartId مهمان از Header یا Cookie
            var guestCartIdHeader = Request.Headers["X-Guest-Cart-Id"].ToString();
            if (string.IsNullOrWhiteSpace(guestCartIdHeader) || !Guid.TryParse(guestCartIdHeader, out Guid guestCartId))
                return BadRequest("سبد خرید مهمان یافت نشد.");

            // 3️⃣ Merge سبد مهمان با کاربر
            var result = await _cartService.MergeGuestWithUserAsync(userId, guestCartId);

            return Ok(new ApiResponse<CartDto>
            {
                IsSuccess = true,
                Message = "سبد مهمان با حساب شما ادغام شد",
                Data = result
            });
        }


        [HttpDelete("Clear")]
        public async Task<IActionResult> ClearCart()
        {
            await _cartService.ClearCartAsync();
            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "سبد خرید پاک شد",
                Data = null
            });
        }
    }
}