
namespace AlooGiyah_Domain.Interfaces;

public interface IEmail
{
    Task SendEmailAsync(string to, string subject, string body);
}
