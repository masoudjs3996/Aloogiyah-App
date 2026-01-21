using AlooGiyah_Application.Commons;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Http;
using System.Net;
using System.Text.Json;

namespace AlooGiyah_API.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
        {
            _next = next ?? throw new ArgumentNullException(nameof(next));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _env = env ?? throw new ArgumentNullException(nameof(env));
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            ApiResponse<object> response;

            switch (exception)
            {
                case NotFoundException notFoundEx:
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                    response = new ApiResponse<object>(notFoundEx.Message, "NOT_FOUND");
                    break;

                case UnauthorizedException unauthorizedEx:
                    context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    response = new ApiResponse<object>(unauthorizedEx.Message, "UNAUTHORIZED");
                    break;

                case ForbiddenException forbiddenEx:
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    response = new ApiResponse<object>(forbiddenEx.Message, "FORBIDDEN");
                    break;

                case BadRequestException badRequestEx:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response = new ApiResponse<object>(badRequestEx.Message, "BAD_REQUEST");
                    break;

                case ValidationException validationEx:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest; // اینجا اصلاح شد: HttpStatusCode نه HttpHttpStatusCode

                    // رفع مشکل نوع Errors
                    var validationErrors = new List<string>();

                    if (validationEx.Errors != null)
                    {
                        foreach (var error in validationEx.Errors)
                        {
                            if (error.Value != null)
                            {
                                validationErrors.AddRange(error.Value);
                            }
                        }
                    }

                    response = new ApiResponse<object>(
                        errorMessage: validationEx.Message ?? "اطلاعات ورودی نامعتبر است.",
                        errorCode: "VALIDATION_ERROR",
                        additionalErrors: validationErrors.ToArray()
                    );
                    break;

                default:
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    var errorMsg = _env.IsDevelopment()
                        ? exception.Message
                        : "خطایی در سرور رخ داده است. لطفاً بعداً تلاش کنید.";

                    response = _env.IsDevelopment()
                        ? new ApiResponse<object>(exception) // جزئیات کامل در حالت توسعه
                        : new ApiResponse<object>(errorMsg, "INTERNAL_SERVER_ERROR");
                    break;
            }

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
        }
    }
}