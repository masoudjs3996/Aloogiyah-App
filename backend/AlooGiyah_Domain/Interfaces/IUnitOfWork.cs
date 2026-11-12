
namespace AlooGiyah_Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync();

    Task<ITransaction> BeginTransactionAsync();
    Task<ITransaction> BeginTransactionAsync(System.Data.IsolationLevel isolationLevel);
}
