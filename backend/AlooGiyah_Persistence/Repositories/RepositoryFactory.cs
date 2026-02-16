using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Persistence.Context;

namespace AlooGiyah_Persistence.Repositories;

public class RepositoryFactory : IRepositoryFactory
{
    private readonly AlooGiyahDbContext _context;

    // مپ برای فایل‌ها
    private readonly Dictionary<EntityFile, Type> _fileEntityMap;

    // مپ برای کامنت‌ها
    private readonly Dictionary<EntityComment, Type> _commentEntityMap;

    public RepositoryFactory(AlooGiyahDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));

        _fileEntityMap = new Dictionary<EntityFile, Type>
        {
            { EntityFile.Profile, typeof(User) },
            { EntityFile.Product, typeof(Product) },
            { EntityFile.Article, typeof(Article) },
            { EntityFile.AgriculturalProduct, typeof(AgriculturalProduct) },
            { EntityFile.ServiceRequest, typeof(ServiceRequest) },
            { EntityFile.Auction, typeof(Auction) },
            { EntityFile.Category, typeof(Category) },
            { EntityFile.Farm, typeof(Farm) },
            {EntityFile.Slider, typeof(Slider) }

        };

        _commentEntityMap = new Dictionary<EntityComment, Type>
        {
            { EntityComment.Product, typeof(Product) },
            { EntityComment.AgriculturalProduct, typeof(AgriculturalProduct) },
            { EntityComment.Article, typeof(Article) },
            { EntityComment.Auction, typeof(Auction) },
            { EntityComment.ServiceRequest, typeof(ServiceRequest) }
        };
    }

    // گرفتن ریپازیتوری برای فایل‌ها
    public IGenericRepository<T> GetFileRepository<T>(EntityFile entityType) where T : BaseEntity
    {
        if (!_fileEntityMap.ContainsKey(entityType))
            throw new Exception($"EntityFile {entityType} is not supported.");

        var mappedType = _fileEntityMap[entityType];
        if (typeof(T) != mappedType)
            throw new Exception($"Requested type {typeof(T).Name} does not match EntityFile {mappedType.Name}.");

        return new GenericRepository<T>(_context);
    }

    // گرفتن ریپازیتوری برای کامنت‌ها
    public IGenericRepository<T> GetCommentRepository<T>(EntityComment entityType) where T : BaseEntity
    {
        if (!_commentEntityMap.ContainsKey(entityType))
            throw new Exception($"EntityComment {entityType} is not supported.");

        var mappedType = _commentEntityMap[entityType];
        if (typeof(T) != mappedType)
            throw new Exception($"Requested type {typeof(T).Name} does not match EntityComment {mappedType.Name}.");

        return new GenericRepository<T>(_context);
    }
}
