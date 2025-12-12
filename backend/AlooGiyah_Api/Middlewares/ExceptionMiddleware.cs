using AlooGiyah_Application.Commons;
using AlooGiyah_Shared.Exceptions;
using System.Net;

namespace AlooGiyah_API.Middlewares;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }


    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        HttpStatusCode status;
        string message;

        switch (exception)
        {
            case NotFoundException:
                status = HttpStatusCode.NotFound;
                message = exception.Message;
                break;

            case UnauthorizedException:
                status = HttpStatusCode.Unauthorized;
                message = exception.Message;
                break;

            case ForbiddenException:
                status = HttpStatusCode.Forbidden;
                message = exception.Message;
                break;

            case BadRequestException:
                status = HttpStatusCode.BadRequest;
                message = exception.Message;
                break;

            case ValidationException validationEx:
                status = HttpStatusCode.BadRequest;
                return context.Response.WriteAsJsonAsync(new
                {
                    isSuccess = false,
                    message = validationEx.Message,
                    errors = validationEx.Errors
                });

            default:
                status = HttpStatusCode.InternalServerError;
                message = _env.IsDevelopment() ? exception.Message : "خطایی در سرور رخ داده است.";
                break;
        }

        var response = new ApiResponse<string>(false, message);
        context.Response.StatusCode = (int)status;
        return context.Response.WriteAsJsonAsync(response);
    }

}