using AlooGiyah_Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Npgsql;
using System.Data;

namespace AlooGiyah_Persistence.Connection
{
    public class PostgresConnectionFactory : IDbConnectionFactory
    {
        private readonly IConfiguration _configuration;

        public PostgresConnectionFactory(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public IDbConnection CreateConnection()
        {
            var connString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

            return new NpgsqlConnection(connString);
        }


    }

}
