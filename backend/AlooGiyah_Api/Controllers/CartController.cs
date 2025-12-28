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
        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }
        #endregion

        #region Get Cart
        [HttpGet("Get")]
        public async Task<IActionResult> GetCart([FromQuery] Guid? cartId)
        {
            // اگر کاربر لاگین کرده، UserId رو از توکن بگیره، وگرنه cartId از کوکی
            var userId = User.Identity?.IsAuthenticated == true
                ? int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0")
                : (int?)null;

            var result = await _cartService.GetCartAsync(cartId, userId);

            return Ok(new ApiResponse<CartDto>
            {
                IsSuccess = true,
                Message = "سبد خرید با موفقیت دریافت شد",
                Data = result
            });
        }
        #endregion

        #region Add To Cart
        [HttpPost("Add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (dto.CartId == Guid.Empty)
                return BadRequest(new ApiResponse<object>
                {
                    IsSuccess = false,
                    Message = "شناسه سبد خرید (CartId) الزامی است."
                });

            if (dto.Quantity <= 0)
                return BadRequest(new ApiResponse<object>
                {
                    IsSuccess = false,
                    Message = "تعداد محصول باید مثبت باشد."
                });

            var result = await _cartService.AddToCartAsync(dto);

            return Ok(new ApiResponse<CartDto>
            {
                IsSuccess = true,
                Message = "محصول با موفقیت به سبد خرید اضافه شد",
                Data = result
            });
        }
        #endregion

        #region Update Cart Item
        [HttpPut("UpdateItem")]
        public async Task<IActionResult> UpdateCartItem([FromBody] UpdateCartItemDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (dto.Quantity <= 0)
                return BadRequest(new ApiResponse<object>
                {
                    IsSuccess = false,
                    Message = "تعداد باید مثبت باشد."
                });

            var result = await _cartService.UpdateCartItemAsync(dto);

            return Ok(new ApiResponse<CartDto>
            {
                IsSuccess = true,
                Message = "تعداد محصول در سبد خرید با موفقیت ویرایش شد",
                Data = result
            });
        }
        #endregion

        #region Remove From Cart
        [HttpDelete("RemoveItem")]
        public async Task<IActionResult> RemoveFromCart([FromQuery] RemoveCartItemDto dto)
        {
            if (dto.CartId == Guid.Empty || dto.ItemCode == null || dto.ItemCode == string.Empty)
                return BadRequest(new ApiResponse<object>
                {
                    IsSuccess = false,
                    Message = "شناسه سبد و آیتم الزامی است."
                });

            var result = await _cartService.RemoveFromCartItemAsync(dto);

            return Ok(new ApiResponse<CartDto>
            {
                IsSuccess = true,
                Message = "محصول با موفقیت از سبد خرید حذف شد",
                Data = result
            });
        }
        #endregion

        #region Merge Guest Cart (After Login)
        [Authorize]
        [HttpPost("Merge")]
        public async Task<IActionResult> MergeGuestCart([FromBody] Guid guestCartId)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                                   ?? throw new UnauthorizedAccessException());

            var result = await _cartService.MergeGuestWithUserAsync(guestCartId, userId);

            return Ok(new ApiResponse<CartDto>
            {
                IsSuccess = true,
                Message = "سبد خرید مهمان با حساب شما ادغام شد",
                Data = result
            });
        }
        #endregion

        #region Clear Cart
        [HttpDelete("Clear")]
        public async Task<IActionResult> ClearCart([FromQuery] Guid cartId)
        {
            if (cartId == Guid.Empty)
                return BadRequest(new ApiResponse<object>
                {
                    IsSuccess = false,
                    Message = "شناسه سبد خرید الزامی است."
                });

            await _cartService.ClearCartAsync(cartId);

            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "سبد خرید با موفقیت پاک شد",
                Data = null
            });
        }
        #endregion
    }
}
