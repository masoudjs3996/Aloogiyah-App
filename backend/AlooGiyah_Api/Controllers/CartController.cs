using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Cart;
using AlooGiyah_Application.Interfaces.Store;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartController : ControllerBase
    {
        #region Constructor
        private readonly ICartService _cartService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CartController(ICartService cartService, IHttpContextAccessor httpContextAccessor)
        {
            _cartService = cartService;
            _httpContextAccessor = httpContextAccessor;
        }
        #endregion

        #region Get Cart
        [Authorize]
        [HttpGet]
    public async Task<IActionResult> GetCarts()
    {
        var carts = await _cartService.GetCartAsync();

        return Ok(new ApiResponse<CartDto>
        {
            IsSuccess = true,
            Message = "سبدهای خرید دریافت شد",
            Data = carts
        });
    }
        #endregion

        #region Add
        [Authorize]
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
        #endregion

        #region Update Item
        [Authorize]
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
        #endregion

        #region RemoveItem
        [Authorize]
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

        #region Clear
        [Authorize]
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
        #endregion
    }
}