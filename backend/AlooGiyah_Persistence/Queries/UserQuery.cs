using AlooGiyah_Application.DTOs;
using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Domain.Interfaces;
using Dapper;
using System.Data;

namespace AlooGiyah_Persistence.Queries;

public class UserQuery : IUserQuery
{
    private readonly IDbConnectionFactory _connectionFactory;

    public UserQuery(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<UserDto?> GetByIdAsync(int id)
    {
        using var connection = _connectionFactory.CreateConnection();

        const string sql = """
            SELECT 
                user_id AS Id,
                full_name AS FullName,
                email
            FROM users
            WHERE user_id = @Id
        """;

        return await connection.QueryFirstOrDefaultAsync<UserDto>(sql, new { Id = id });
    }

    public async Task<IEnumerable<UserDto>> GetAllAsync()
    {
        using var connection = _connectionFactory.CreateConnection();

        const string sql = """
            SELECT 
                user_id AS Id,
                full_name AS FullName,
                email
            FROM users
        """;

        return await connection.QueryAsync<UserDto>(sql);
    }
}
