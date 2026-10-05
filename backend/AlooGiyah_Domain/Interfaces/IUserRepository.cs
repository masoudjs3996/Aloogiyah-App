using AlooGiyah_Domain.Entities.UserFolder;

namespace AlooGiyah_Domain.Interfaces;

public interface IUserRepository : IGenericRepository<User>
{
    Task<User?> GetByUsernameAsync(string username);
    Task<bool> UpdateEmailConfirmationAsync(string userCode, string? newCode, bool isConfirmed);
}
