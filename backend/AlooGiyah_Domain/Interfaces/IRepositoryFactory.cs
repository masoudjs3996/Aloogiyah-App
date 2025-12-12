using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Enums;


namespace AlooGiyah_Domain.Interfaces;

public interface IRepositoryFactory
{
    IGenericRepository<T> GetFileRepository<T>(EntityFile entityType) where T : BaseEntity;
    IGenericRepository<T> GetCommentRepository<T>(EntityComment entityType) where T : BaseEntity;
}
