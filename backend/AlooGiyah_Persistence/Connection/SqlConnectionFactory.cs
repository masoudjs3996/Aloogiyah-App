using AlooGiyah_Domain.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Npgsql;
using System.Data;
using System.Data.Common;

namespace AlooGiyah_Persistence.Connection
{
    public class SqlConnectionFactory : IDbConnectionFactory
    {
        private readonly IConfiguration _configuration;

        public SqlConnectionFactory(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        //public IDbConnection CreateConnection()
        //{
        //    return new SqlConnection(
        //        _configuration.GetConnectionString("DefaultConnection"));
        //}

        public IDbConnection CreateConnection()
        {
            var connString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

            var conn = new NpgsqlConnection(connString);
            // conn.Open();   بهتره باز کردن رو به caller بسپاری (مثل Dapper)
            return conn;
        }


    }

}
