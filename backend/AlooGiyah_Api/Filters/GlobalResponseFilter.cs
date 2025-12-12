using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using AlooGiyah_Application.Commons;

namespace AlooGiyah_API.Filters;

public class GlobalResponseFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executedContext = await next();

        // اگر exception داشته باشه، این middleware کاری نداره
        if (executedContext.Exception != null)
            return;

        var result = executedContext.Result;

        switch (result)
        {
            case ObjectResult objectResult:

                // جلوگیری از دوباره بسته‌بندی شدن ApiResponse<T>
                if (objectResult.Value?.GetType().IsGenericType == true &&
                    objectResult.Value.GetType().GetGenericTypeDefinition() == typeof(ApiResponse<>))
                {
                    break; // دست نزن، همینه که باید باشه
                }

                // اگر قبلاً ApiResponse نیست، بسته‌بندیش کن
                if (objectResult.Value is not ApiResponse<object>)
                {
                    var apiResponse = new ApiResponse<object>
                    {
                        IsSuccess = objectResult.StatusCode >= 200 && objectResult.StatusCode < 300,
                        Message = objectResult.StatusCode >= 200 && objectResult.StatusCode < 300
                            ? "درخواست با موفقیت انجام شد."
                            : objectResult.StatusCode == (int)HttpStatusCode.BadRequest
                                ? "درخواست نامعتبر است."
                                : "عملیات انجام نشد.",
                        Data = objectResult.Value
                    };

                    executedContext.Result = new ObjectResult(apiResponse)
                    {
                        StatusCode = objectResult.StatusCode
                    };
                }
                break;

            case EmptyResult:
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

            case StatusCodeResult statusCodeResult:
                var isSuccess = statusCodeResult.StatusCode >= 200 && statusCodeResult.StatusCode < 300;

                executedContext.Result = new ObjectResult(new ApiResponse<string>
                {
                    IsSuccess = isSuccess,
                    Message = isSuccess ? "عملیات موفق بود." : "عملیات با خطا مواجه شد.",
                    Data = null
                })
                {
                    StatusCode = statusCodeResult.StatusCode
                };
                break;

            case JsonResult jsonResult:
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