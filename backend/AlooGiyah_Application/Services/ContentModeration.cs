using System.Globalization;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using AlooGiyah_Shared.Exceptions;
using Microsoft.Extensions.Configuration;

namespace AlooGiyah_Application.Services;

public sealed class ContentModeration(IConfiguration configuration)
{
    private static readonly string[] DefaultTerms = ["پورنوگرافی کودکان", "فروش مواد مخدر", "عکس خصوصی برای اخاذی", "child sexual abuse material"];
    private readonly string[] _terms = DefaultTerms.Concat(configuration.GetSection("Moderation:BlockedTerms")
        .GetChildren().Select(item => item.Value ?? "")).Select(Normalize).Where(term => term.Length > 0).Distinct().ToArray();

    public void Validate(params string?[] fields)
    {
        var text = $" {Normalize(string.Join(' ', fields))} ";
        if (_terms.Any(term => text.Contains($" {term} ", StringComparison.Ordinal)))
            throw new BadRequestException("این متن با قوانین محتوا سازگار نیست. لطفاً متن را بازبینی کنید.");
    }

    private static string Normalize(string value)
    {
        var plain = Regex.Replace(WebUtility.HtmlDecode(value), "<[^>]*>", " ");
        var result = new StringBuilder(plain.Length);
        foreach (var c in plain.Normalize(NormalizationForm.FormKC))
        {
            if (char.GetUnicodeCategory(c) is UnicodeCategory.NonSpacingMark or UnicodeCategory.Format || c == '\u0640') continue;
            if (char.IsLetterOrDigit(c)) result.Append(c switch { 'ي' => 'ی', 'ك' => 'ک', _ => char.ToLowerInvariant(c) });
            else if (result.Length > 0 && result[^1] != ' ') result.Append(' ');
        }
        return result.ToString().Trim();
    }
}
