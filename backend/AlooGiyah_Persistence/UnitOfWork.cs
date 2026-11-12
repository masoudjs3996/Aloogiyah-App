using Microsoft.EntityFrameworkCore;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Persistence.Context;


namespace AlooGiyah_Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly AlooGiyahDbContext _context;
    private bool _disposed;

    public UnitOfWork(AlooGiyahDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public async Task<ITransaction> BeginTransactionAsync()
    {
        var transaction = await _context.Database.BeginTransactionAsync();
        return new EfCoreTransaction(transaction);
    }

    public async Task<ITransaction> BeginTransactionAsync(System.Data.IsolationLevel isolationLevel)
    {
        return new EfCoreTransaction(await _context.Database.BeginTransactionAsync(isolationLevel));
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (_disposed)
            return;

        if (disposing)
        {
            _context?.Dispose();
        }

        _disposed = true;
    }

    ~UnitOfWork()
    {
        Dispose(false);
    }
}
