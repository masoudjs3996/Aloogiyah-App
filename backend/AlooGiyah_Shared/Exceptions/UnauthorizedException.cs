namespace AlooGiyah_Shared.Exceptions
{
    public class UnauthorizedException : AppException
    {
        public UnauthorizedException(string message, string errorCode = "401")
            : base(message, errorCode)
        {
        }
    }

}
