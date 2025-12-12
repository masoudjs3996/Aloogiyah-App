using System;
using System.Threading.Tasks;

namespace AlooGiyah_Domain.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        Task<int> SaveChangesAsync();

        Task<ITransaction> BeginTransactionAsync();
    }
}
