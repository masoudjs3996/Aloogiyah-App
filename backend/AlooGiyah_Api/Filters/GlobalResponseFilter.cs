using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Net;
using AlooGiyah_Application.Commons;

namespace AlooGiyah_API.Filters;

public class GlobalResponseFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next)
    {
        var executedContext = await next();

        // اگر Exception رخ داده، کاری نکن
        if (executedContext.Exception != null)
            return;

        var result = executedContext.Result;

        // ===============================
        // ❌ خط قرمزها (به اینا دست نزن)
        // ===============================
        if (result is FileResult ||
            result is PhysicalFileResult ||
            result is VirtualFileResult ||
            result is RedirectResult ||
            result is RedirectToActionResult ||
            result is RedirectToRouteResult)
        {
            return;
        }

        switch (result)
        {
            case ObjectResult objectResult:
                {
                    // اگر قبلاً ApiResponse<T> هست، دوباره Wrap نکن
                    if (objectResult.Value?.GetType().IsGenericType == true &&
                        objectResult.Value.GetType().GetGenericTypeDefinition() == typeof(ApiResponse<>))
                    {
                        return;
                    }

                    var statusCode = objectResult.StatusCode ?? StatusCodes.Status200OK;
                    var isSuccess = statusCode >= 200 && statusCode < 300;

                    var apiResponse = new ApiResponse<object>
                    {
                        IsSuccess = isSuccess,
                        Message = isSuccess
                            ? "درخواست با موفقیت انجام شد."
                            : statusCode == (int)HttpStatusCode.BadRequest
                                ? "درخواست نامعتبر است."
                                : "عملیات انجام نشد.",
                        Data = objectResult.Value
                    };

                    executedContext.Result = new ObjectResult(apiResponse)
                    {
                        StatusCode = statusCode
                    };

                    break;
                }

            case EmptyResult:
                {
                    executedContext.Result = new ObjectResult(new ApiResponse<string>
                    {
                        IsSuccess = true,
                        Message = "بدون خروجی ولی موفق",
                        Data = null
                    })
                    {
                        StatusCode = StatusCodes.Status200OK
                    };

                    break;
                }

            case StatusCodeResult statusCodeResult:
                {
                    var isSuccess = statusCodeResult.StatusCode >= 200 &&
                                    statusCodeResult.StatusCode < 300;

                    executedContext.Result = new ObjectResult(new ApiResponse<string>
                    {
                        IsSuccess = isSuccess,
                        Message = isSuccess
                            ? "عملیات موفق بود."
                            : "عملیات با خطا مواجه شد.",
                        Data = null
                    })
                    {
                        StatusCode = statusCodeResult.StatusCode
                    };

                    break;
                }

            case JsonResult jsonResult:
                {
                    executedContext.Result = new ObjectResult(new ApiResponse<object>
                    {
                        IsSuccess = true,
                        Message = "درخواست با موفقیت انجام شد.",
                        Data = jsonResult.Value
                    })
                    {
                        StatusCode = jsonResult.StatusCode ?? StatusCodes.Status200OK
                    };

                    break;
                }
        }
    }
}
