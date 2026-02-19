using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Query
{
    public interface IUserQuery
    {
        Task<UserDto?> GetByCodeAsync(string code, bool includeRole = true);

        /// <summary>
        /// گرفتن کاربر بر اساس username (معمولاً برای login)
        /// </summary>
        Task<User?> GetByUsernameAsync(string username);

        /// <summary>
        /// جستجوی پویا و صفحه‌بندی شده کاربران + فیلترها
        /// </summary>
        Task<PagedResult<UserDto>> GetPagedFilteredAsync(UserFilterDto filter);

        /// <summary>
        /// چک وجود کاربر با username (برای ثبت‌نام)
        /// </summary>
        Task<bool> ExistsByUsernameAsync(string username);

        // Application/Interfaces/IUserQueryRepository.cs
        Task<UserDto?> GetByIdAsync(int userId, bool includeRole = true);
    }
}
