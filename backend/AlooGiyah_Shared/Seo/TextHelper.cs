

namespace AlooGiyah_Shared.Seo
{
    public static class TextHelper
    {
        public static string Toslug(this string value)
        {
            return value.Trim().ToLower()
                .Replace("!", "")
                .Replace("@", "")
                .Replace("#", "")
                .Replace("$", "")
                .Replace("%", "")
                .Replace("^", "")
                .Replace("&", "")
                .Replace("*", "")
                .Replace("(", "")
                .Replace(")", "")
                .Replace("_", "")
                .Replace("<", "")
                .Replace(">", "")
                .Replace("?", "")
                .Replace("/", "")
                .Replace(" ", "-")
                .Replace("~", "")
                .Replace("`", "")
                .Replace("[", "")
                .Replace("]", "")
                .Replace("{", "")
                .Replace("}", "")
                .Replace("=", "")
                .Replace("+", "")
                .Replace("|", "")
                .Replace(@"\", "");
        }
    }
}
