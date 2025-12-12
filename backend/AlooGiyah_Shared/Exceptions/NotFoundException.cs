namespace AlooGiyah_Shared.Exceptions;

public class NotFoundException : AppException
{
    public NotFoundException(string message, string errorCode = "404")
        : base(message,errorCode)
    {
    }
}
