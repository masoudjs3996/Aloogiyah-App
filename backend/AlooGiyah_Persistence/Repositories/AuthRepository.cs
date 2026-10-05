using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System;

namespace AlooGiyah_Persistence.Repositories;

public class AuthRepository : GenericRepository<RefreshToken>, IAuthRepository

{
    #region Constructor
    private readonly DbSet<RefreshToken> _dbSet;

    public AuthRepository(AlooGiyahDbContext context) : base(context)
    {
        _dbSet = context.Set<RefreshToken>();
    }
    #endregion


    public async Task<RefreshToken?> GetByTokenAsync(string token)
    {
        if (string.IsNullOrEmpty(token))
            throw new ArgumentNullException(nameof(token));

        return await _dbSet.Where(t => !EF.Property<bool>(t, "IsDeleted") && t.Token == token)
                          .FirstOrDefaultAsync();
    }

    public async Task MarkAsUsedAsync(RefreshToken token)
    {
        if (token == null)
            throw new ArgumentNullException(nameof(token));

        token.IsUsed = true;
        token.IsRevoked = true;
        if (token is BaseEntity baseEntity)
        {
            baseEntity.UpdatedAt = DateTime.UtcNow;
        }

        _dbSet.Update(token);
    }


    public async Task RevokeAllTokensForUserAsync(int userId)
    {
        var tokens = await _dbSet.Where(t => !EF.Property<bool>(t, "IsDeleted") && t.UserId == userId && !t.IsRevoked && !t.IsUsed)
                                 .ToListAsync();

        foreach (var token in tokens)
        {
            token.IsRevoked = true;
            token.IsUsed = true;
            if (token is BaseEntity baseEntity)
            {
                baseEntity.UpdatedAt = DateTime.UtcNow;
            }
            _dbSet.Update(token);
        }
    }
}