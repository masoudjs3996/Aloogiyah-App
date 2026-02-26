using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Address;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = "NotGuest")] // همه نیاز به لاگین دارن
public class AddressController : ControllerBase
{
    private readonly IAddressService _addressService;

    public AddressController(IAddressService addressService)
    {
        _addressService = addressService;
    }

    [HttpPost("Create")]
    public async Task<IActionResult> Create([FromBody] AddressCreateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _addressService.CreateAsync(dto);

        return Ok(new ApiResponse<AddressDto>
        {
            IsSuccess = true,
            Message = "آدرس با موفقیت ثبت شد.",
            Data = result
        });
    }

    [HttpGet("GetByFilter")]
    public async Task<IActionResult> GetByFilter([FromQuery] AddressFilterDto filter)
    {
        var result = await _addressService.GetByFilterAsync(filter);

        return Ok(new ApiResponse<PagedResult<AddressDto>>
        {
            IsSuccess = true,
            Message = "لیست آدرس‌ها با موفقیت دریافت شد.",
            Data = result
        });
    }

    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCode(string code)
    {
        var result = await _addressService.GetByCodeAsync(code)
                     ?? throw new NotFoundException("آدرس یافت نشد.");

        return Ok(new ApiResponse<AddressDto>
        {
            IsSuccess = true,
            Message = "آدرس با موفقیت دریافت شد.",
            Data = result
        });
    }

    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] AddressUpdateDto dto)
    {
        var result = await _addressService.UpdateAsync(dto);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "آدرس با موفقیت ویرایش شد.",
            Data = result
        });
    }

    [HttpDelete("Delete")]
    public async Task<IActionResult> Delete(string code)
    {
        var result = await _addressService.DeleteAsync(code);

        return Ok(new ApiResponse<string>
        {
            IsSuccess = true,
            Message = "آدرس با موفقیت حذف شد.",
            Data = code
        });
    }
}