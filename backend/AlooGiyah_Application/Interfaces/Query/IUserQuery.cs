using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Application.Interfaces.Query
{
    public interface IUserQuery
    {
        Task<UserDto?> GetByCodeAsync(string code, bool includeRole = true);
        Task<User?> GetByUsernameAsync(string username);
        Task<PagedResult<UserDto>> GetPagedFilteredAsync(UserFilterDto filter);
        Task<bool> ExistsByUsernameAsync(string username);
        Task<UserDto?> GetByIdAsync(int userId, bool includeRole = true);
    }
}
