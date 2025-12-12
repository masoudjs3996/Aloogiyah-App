
namespace AlooGiyah_Shared.Exceptions;

public class BadRequestException : AppException
{
    public BadRequestException(string message, string errorCode="400")
        : base(message,errorCode)
    {
    }
}
