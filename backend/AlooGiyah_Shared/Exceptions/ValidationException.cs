namespace AlooGiyah_Shared.Exceptions
{
    public class ValidationException : AppException
    {
        public IDictionary<string, string[]> Errors { get; }

        public ValidationException(string message, IDictionary<string, string[]> errors)
            : base(message)
        {
            Errors = errors;
        }
    }

}
