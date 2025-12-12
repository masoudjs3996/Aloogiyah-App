
namespace AlooGiyah_Shared.Exceptions;

public class ForbiddenException : AppException
{
    public ForbiddenException(string message, string errorCode = "403" )
        : base(message,errorCode)
    {
    }
}
