
namespace AlooGiyah_Shared.Exceptions;

public class AppException : Exception
{
    public string ErrorCode { get; }

    public AppException(string message, string errorCode = "0000")
        : base(message)
    {
        ErrorCode = errorCode;
    }
}
