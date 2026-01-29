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


    #region Get Cart
    [HttpGet]
    public async Task<IActionResult> GetCarts()
    {
        var carts = await _cartService.GetCartsAsync();

        return Ok(new ApiResponse<List<CartDto>>
        {
            IsSuccess = true,
            Message = "سبدهای خرید دریافت شد",
            Data = carts
        });
    }
    #endregion

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
        #region RemoveItem
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
        #endregion

        #region Merge Guest Cart
        [Authorize]
        [HttpPost("Merge")]
        public async Task<IActionResult> MergeGuestCart()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            await _cartService.MergeGuestCartWithUserAsync(userId);

            // دفاع در عمق: حتی اگر سرویس پاک نکرده باشد، اینجا پاک کن
            Response.Cookies.Delete("GuestCartId");

            Response.Headers.Add("X-Guest-Token-Expired", "true");

            return Ok(new ApiResponse
            {
                IsSuccess = true,
                Message = "سبد مهمان با حساب شما ادغام شد"
            });
        }
        #endregion

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