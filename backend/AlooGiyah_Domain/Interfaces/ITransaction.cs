namespace AlooGiyah_Domain.Interfaces
{
    public interface ITransaction : IAsyncDisposable
    {
        Task CommitAsync();
        Task RollbackAsync();
    }
}
