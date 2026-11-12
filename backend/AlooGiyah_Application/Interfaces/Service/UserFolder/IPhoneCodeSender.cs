namespace AlooGiyah_Application.Interfaces.Service.UserFolder;

public interface IPhoneCodeSender
{
    bool IsConfigured { get; }
    Task SendAsync(string phoneNumber, string firstName, string lastName, string code);
}
