using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.ServiceRequest;
using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ServiceRequestController : ControllerBase
{
    #region Constructor
    private readonly IServiceRequestService _service;

    public ServiceRequestController(IServiceRequestService service)
    {
        _service = service;
    }
    #endregion


    #region Create
    [Authorize]
    [HttpPost("Create")]
    public async Task<IActionResult> CreateServiceRequest([FromBody] ServiceRequestCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "درخواست یا موفقیت ثبت شد",
            Data = result
        });
    }
    #endregion

    #region GetByCode
    [Authorize]
    [HttpGet("GetByCode")]
    public async Task<IActionResult> GetByCodeAsync(string code)
    {
        var result = await _service.GetByCodeAsync(code);
        if (result == null) throw new NotFoundException(ErrorMessages.ErrorNullServiceRequest);

        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "سرویس درخواستی باموفقیت دریافت شد",
            Data = result
        });
    }
    #endregion

    #region GetByFilter
    [Authorize]
    [HttpGet("GetByfilter")]
    public async Task<IActionResult> GetByfilter([FromQuery] ServiceRequestFilterDto filter)
    {
        PagedResult<ServiceRequestDto> result = await _service.GetPagedAsync(filter);
        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "لیست سرویس درخواست شما با موفقیت دریافت شد ",
            Data = result
        });
    }
    #endregion

    #region Update
    [Authorize]
    [HttpPut("Update")]
    public async Task<IActionResult> Update([FromBody] ServiceRequestUpdateDto dto)
    {

         var result = await _service.UpdateAsync(dto);

        return Ok(new ApiResponse<bool>
        {
            IsSuccess = true,
            Message = "سرویس با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region Update
    [Authorize]
    [HttpPatch("AddProvider")]
    public async Task<IActionResult> AddProvider([FromBody] AddProviderDto dto)
    {

        var result = await _service.AddProviderAsync(dto);

        return Ok(new ApiResponse<UserDto>
        {
            IsSuccess = true,
            Message = "سرویس با موفقیت ویرایش شد",
            Data = result
        });
    }
    #endregion

    #region Delete
    [Authorize]
    [HttpDelete("Delete")]
    public async Task<IActionResult> Delete(string code)
    {
        await _service.DeleteAsync(code);
        return Ok(new ApiResponse<object>
        {
            IsSuccess = true,
            Message = "سرویس با موفقیت حذف شد",
           
        });
    }
    #endregion
}
