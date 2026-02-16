using Microsoft.Extensions.Configuration;
using Microsoft.Data.SqlClient;
using System.Data;
using AlooGiyah_Domain.Interfaces;
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

        public IDbConnection CreateConnection()
        {
            return new SqlConnection(
                _configuration.GetConnectionString("DefaultConnection"));
        }

     
    }

}
