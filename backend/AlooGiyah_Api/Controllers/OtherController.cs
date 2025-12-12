using Microsoft.AspNetCore.Mvc;
using AlooGiyah_Application.Utils;

namespace AlooGiyah_Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OtherController : ControllerBase
{
    #region GenerateCode
    [HttpGet("GenerateCode")]
    public IActionResult GenerateCode()
    {
        var code = CodeGenerator.GenerateCode();
        return Ok(new { code });
    }
    #endregion

    #region DateTimeNow
    [HttpGet("DateTimeNow")]
    public IActionResult GetCurrentTime()
    {
        var utcNow = DateTime.UtcNow;
        var localNow = DateTime.Now;

        return Ok(new
        {
            utc = utcNow.ToString("yyyy-MM-dd HH:mm:ss"),
            local = localNow.ToString("yyyy-MM-dd HH:mm:ss"),
            timezone = TimeZoneInfo.Local.StandardName
        });
    }
    #endregion
}
