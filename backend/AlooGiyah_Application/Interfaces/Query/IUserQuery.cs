using AlooGiyah_Application.DTOs.Users;

namespace AlooGiyah_Application.Interfaces.Query
{
    public interface IUserQuery
    {
        Task<UserDto?> GetByIdAsync(int id);
        Task<IEnumerable<UserDto>> GetAllAsync();
    }
}
