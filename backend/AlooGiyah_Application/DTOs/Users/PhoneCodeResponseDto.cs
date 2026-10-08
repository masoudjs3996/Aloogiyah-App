namespace AlooGiyah_Application.DTOs.Users;

public class PhoneCodeResponseDto
{
    public string ChallengeCode { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public string? TestCode { get; set; }
}
