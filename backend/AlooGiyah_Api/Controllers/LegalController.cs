using AlooGiyah_Application.Commons;
using AlooGiyah_Application.Legal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers;

[ApiController, Route("api/Legal"), AllowAnonymous]
public class LegalController(IConfiguration configuration) : ControllerBase
{
    [HttpGet("Terms")]
    public IActionResult Terms([FromQuery] string? version = null)
    {
        var terms = MarketplaceTerms.Get(version);
        Response.Headers.CacheControl = "no-store";
        return Ok(new ApiResponse<object> { IsSuccess = true, Data = new {
            Document = terms.Document, terms.Hash,
            Operator = new {
                Name = configuration["Legal:OperatorName"],
                Address = configuration["Legal:PostalAddress"],
                Email = configuration["Legal:SupportEmail"],
                Phone = configuration["Legal:SupportPhone"]
            }
        } });
    }
}
