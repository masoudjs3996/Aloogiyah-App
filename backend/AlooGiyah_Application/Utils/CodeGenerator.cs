

namespace AlooGiyah_Application.Utils
{
    public static class CodeGenerator
    {
        public static string GenerateCode()
        {
            return Guid.NewGuid().ToString("N").Substring(0, 10).ToUpper();
        }
    }
}
