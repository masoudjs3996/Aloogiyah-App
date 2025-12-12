using AlooGiyah_Domain.Entities;

namespace AlooGiyah_Domain.Interfaces
{
    public interface IAuthRepository
    {
        Task<RefreshToken?> GetByTokenAsync(string token);
        Task MarkAsUsedAsync(RefreshToken token);
        Task AddAsync(RefreshToken token);
        Task RevokeAllTokensForUserAsync(int userId);
    }
}
