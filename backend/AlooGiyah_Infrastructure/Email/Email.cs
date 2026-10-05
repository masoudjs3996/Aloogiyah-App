using Microsoft.Extensions.Configuration;
using MimeKit;
using MailKit.Net.Smtp;
using AlooGiyah_Domain.Interfaces;

namespace AlooGiyah_Infrastructur.Email;

public class Email : IEmail
{
    private readonly IConfiguration _configuration;

    public Email(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    //public async Task SendEmailAsync(string to, string subject, string body)
    //{
    //    var email = new MimeMessage();
    //    email.From.Add(MailboxAddress.Parse(_configuration["EmailSettings:From"]));
    //    email.To.Add(MailboxAddress.Parse(to));
    //    email.Subject = subject;
    //    email.Body = new TextPart(MimeKit.Text.TextFormat.Html) { Text = body };

    //    using var smtp = new SmtpClient();
    //    await smtp.ConnectAsync(_configuration["EmailSettings:SmtpServer"], int.Parse(_configuration["EmailSettings:Port"]), true);
    //    await smtp.AuthenticateAsync(_configuration["EmailSettings:Username"], _configuration["EmailSettings:Password"]);
    //    await smtp.SendAsync(email);
    //    await smtp.DisconnectAsync(true);
    //}
    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var fromAddress = _configuration["EmailSettings:From"] ?? throw new InvalidOperationException("EmailSettings:From is not configured.");
        var smtpServer = _configuration["EmailSettings:SmtpServer"] ?? throw new InvalidOperationException("EmailSettings:SmtpServer is not configured.");
        var portValue = _configuration["EmailSettings:Port"];
        if (!int.TryParse(portValue, out var port))
            throw new InvalidOperationException("EmailSettings:Port must be a valid integer.");
        var username = _configuration["EmailSettings:Username"] ?? throw new InvalidOperationException("EmailSettings:Username is not configured.");
        var password = _configuration["EmailSettings:Password"] ?? throw new InvalidOperationException("EmailSettings:Password is not configured.");

        var email = new MimeMessage();
        email.From.Add(MailboxAddress.Parse(fromAddress));
        email.To.Add(MailboxAddress.Parse(to));
        email.Subject = subject;
        email.Body = new TextPart(MimeKit.Text.TextFormat.Html) { Text = body };

        using var smtp = new SmtpClient();
        try
        {
            // اتصال با SSL (برای پورت 465)
            await smtp.ConnectAsync(
                smtpServer,
                port,
                MailKit.Security.SecureSocketOptions.SslOnConnect
            );

            await smtp.AuthenticateAsync(
                username,
                password
            );

            await smtp.SendAsync(email);
        }
        catch (Exception ex)
        {
            throw new Exception("خطا در ارسال ایمیل: " + ex.Message);
        }
        finally
        {
            await smtp.DisconnectAsync(true);
        }
    }

}
