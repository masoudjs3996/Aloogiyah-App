using System.Data;


namespace AlooGiyah_Domain.Interfaces;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}
