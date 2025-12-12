using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using AlooGiyah_Persistence.Context;
using AlooGiyah_Domain.Entities.UserFolder;


namespace AlooGiyah_Persistence.Repositories;

public class UserRepository : GenericRepository<User>, IUserRepository
{
    #region Constructor
    private readonly DbSet<User> _dbSet;

    public UserRepository(AlooGiyahDbContext context) : base(context)
    {
        _dbSet = context.Set<User>();
    }
    #endregion


    #region گرفتن کاربر با یوزرنیم
    public async Task<User?> GetByUsernameAsync(string username)
    {
        if (string.IsNullOrEmpty(username))
            throw new ArgumentNullException(nameof(username));

        return await _dbSet.Include(u =>u.Role).Where(u => !EF.Property<bool>(u, "IsDeleted") && u.UserName == username).FirstOrDefaultAsync();
    }
    #endregion

    #region تایید ایمیل
    public async Task<bool> UpdateEmailConfirmationAsync(string userCode, string? newCode, bool isConfirmed)
    {
        if (string.IsNullOrEmpty(userCode))
            throw new ArgumentNullException(nameof(userCode));

        var user = await _dbSet.Where(u => !EF.Property<bool>(u, "IsDeleted") && EF.Property<string>(u, "Code") == userCode)
                               .FirstOrDefaultAsync();
        if (user == null)
            return false;

        user.IsEmailConfirmed = isConfirmed;
        user.EmailVerificationCode = newCode;
        user.VerificationCodeExpiration = newCode == null ? null : DateTime.UtcNow.AddMinutes(10);

        // تنظیم مستقیم UpdatedAt از طریق BaseEntity
        if (user is BaseEntity baseEntity)
        {
            baseEntity.UpdatedAt = DateTime.UtcNow;
        }

        _dbSet.Update(user);
        return true;
    }
    #endregion
}