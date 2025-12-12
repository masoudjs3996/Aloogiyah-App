
namespace AlooGiyah_Application.Commons;

public class ApiResponse<T>
{
    public bool IsSuccess { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }

    public ApiResponse() { }

    public ApiResponse(T data, string message ,bool isSuccess)
    {
        IsSuccess = isSuccess;
        Message = message;
        Data = data;
    }

    public ApiResponse(string errorMessage)
    {
        IsSuccess = false;
        Message = errorMessage;
        Data = default;
    }

    public ApiResponse(bool isSuccess, string message)
    {
        IsSuccess = isSuccess;
        Message = message;
        Data = default;
    }
}
