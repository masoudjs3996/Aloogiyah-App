using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Pagination;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using AlooGiyah_Persistence.Context;

namespace AlooGiyah_Persistence.Repositories;

public class GenericRepository<T> : IGenericRepository<T> where T : BaseEntity
{
    #region Constructor
    private readonly AlooGiyahDbContext _context;
    private readonly DbSet<T> _dbSet;

    public GenericRepository(AlooGiyahDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _dbSet = _context.Set<T>();
    }
    #endregion

    public IQueryable<T> GetAll()
    {
        var query = _dbSet.AsQueryable();

        // اعمال SoftDelete با EF.Property
        if (typeof(BaseEntity).IsAssignableFrom(typeof(T)))
        {
            query = query.Where(e => !EF.Property<bool>(e, "IsDeleted"));
        }

        return query;
    }

    public IQueryable<T> GetAllIncludingDeleted() => _dbSet.AsQueryable();

    private IQueryable<T> GetQuery()
    {
        return _dbSet.Where(e => !e.IsDeleted);
    }


    #region گرفتن همه اطلاعات
    public async Task<IEnumerable<T>> GetAllAsync()
    {
        if (typeof(BaseEntity).IsAssignableFrom(typeof(T)))
        {
            return await _dbSet.Cast<BaseEntity>()
                              .Where(e => !e.IsDeleted)
                              .Cast<T>()
                              .ToListAsync();
        }

        return await _dbSet.ToListAsync();
    }
    #endregion

    #region گرفتن اطلاعات بر اساس فیلتر
    public async Task<PagedResult<T>> GetPagedAsync(
        Expression<Func<T, bool>>? filter = null,
        int pageNumber = 1,
        int pageSize = 10,
        Expression<Func<T, object>>? orderBy = null)
    {
        IQueryable<T> query = _dbSet;

        // اعمال فیلتر
        if (filter != null)
        {
            query = query.Where(filter);
        }

        // اعمال ترتیب
        if (orderBy != null)
        {
            query = query.OrderBy(orderBy);
        }

        // محاسبه تعداد کل موارد
        var totalCount = await query.CountAsync();

        // پیجینیشن
        var items = await query.Skip((pageNumber - 1) * pageSize)
                               .Take(pageSize)
                               .ToListAsync();

        // بازگشت نتیجه پیجینیشن
        return new PagedResult<T>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }
    #endregion

    #region گرفتن اطلاعات با فیلتر و اینکلود
    public async Task<PagedResult<T>> GetPagedWithIncludeAsync(
    Expression<Func<T, bool>>? filter = null,
    int pageNumber = 1,
    int pageSize = 10,
    Expression<Func<T, object>>? orderBy = null,
    params Expression<Func<T, object>>[] includes)
    {
        IQueryable<T> query = _dbSet;

        // اعمال Include ها
        if (includes != null)
        {
            foreach (var include in includes)
            {
                query = query.Include(include);
            }
        }

        // اعمال فیلتر
        if (filter != null)
        {
            query = query.Where(filter);
        }

        // اعمال ترتیب
        if (orderBy != null)
        {
            query = query.OrderBy(orderBy);
        }

        // محاسبه تعداد کل
        var totalCount = await query.CountAsync();

        // پیجینیشن
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<T>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }
    #endregion

    #region گرفتن اطلاعات کامل بدون اینکلود بت ریزالت
    public async Task<PagedResult<TResult>> GetPagedProjectedAsync<TResult>(
          Expression<Func<T, bool>>? filter = null,
          Expression<Func<T, TResult>> selector = null!,
          int pageNumber = 1,
          int pageSize = 10,
          Expression<Func<T, object>>? orderBy = null,
          bool orderByDescending = true, // اضافه شد!
          string[]? includes = null, // پشتیبانی از string includes
          params Expression<Func<T, object>>[] expressionIncludes) // برای ThenInclude
    {
        IQueryable<T> query = GetQuery();

        // اعمال string includes (مثل "OrderItems.Product")
        if (includes != null)
        {
            foreach (var include in includes)
            {
                query = query.Include(include);
            }
        }

        // اعمال Expression includes + ThenInclude
        if (expressionIncludes != null)
        {
            foreach (var include in expressionIncludes)
            {
                query = query.Include(include);
            }
        }

        // اعمال فیلتر
        if (filter != null)
            query = query.Where(filter);

        // اعمال مرتب‌سازی
        if (orderBy != null)
        {
            query = orderByDescending
                ? query.OrderByDescending(orderBy)
                : query.OrderBy(orderBy);
        }
        else
        {
            // پیش‌فرض: جدیدترین اول
            query = query.OrderByDescending(o => o.CreatedAt);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(selector)
            .ToListAsync();

        return new PagedResult<TResult>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }
    #endregion

    #region گرفتن اطلاعات بر اساس ایدی
    public async Task<T?> GetByIdAsync(int id)
    {
        if (typeof(BaseEntity).IsAssignableFrom(typeof(T)))
        {
            string idPropertyName = $"{typeof(T).Name}Id"; // نام پراپرتی کلید اصلی (مثل ProductId)
            return await _dbSet.Where(e => !EF.Property<bool>(e, "IsDeleted") && EF.Property<int>(e, idPropertyName) == id)
                              .FirstOrDefaultAsync();
        }

        return await _dbSet.FindAsync(id);
    }
    #endregion

    #region گرقتن ایدی بر اساس کد
    public async Task<int?> GetIdByCodeAsync(
        string code,
        Expression<Func<T, int>> keySelector)
    {
        var entity = await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Code == code);

        if (entity == null)
            return null;

        return keySelector.Compile()(entity);
    }


    #endregion

    #region گرفتن کد بر اساس ایدی
    public async Task<string?> GetCodeByIdAsync(int id)
    {
        // فرض می‌کنیم T از BaseEntity ارث می‌برد و Code دارد
        var entity = await _dbSet.FirstOrDefaultAsync(e => EF.Property<int>(e, $"{typeof(T).Name}Id") == id);
        return entity?.Code;
    }
    #endregion

    #region گرفتن اطلاعات بر اساس کد
    public async Task<T?> GetByCodeAsync(string code)
    {
        if (string.IsNullOrEmpty(code))
            throw new ArgumentNullException(nameof(code));

        if (typeof(BaseEntity).IsAssignableFrom(typeof(T)))
        {
            return await _dbSet.Cast<BaseEntity>()
                              .Where(c => !c.IsDeleted && c.Code == code)
                              .Cast<T>()
                              .FirstOrDefaultAsync();
        }

        // اگر نوع T از BaseEntity ارث نبرده باشد، فرض می‌کنیم کد یک کلید اصلی است
        return await _dbSet.FindAsync(code);
    }
    #endregion

    #region گرفتن اطلاعات بر اساس کد با اینکلود
    public async Task<T?> GetByCodeWithIncludeAsync(string code, params string[] includes)
    {
        if (string.IsNullOrEmpty(code))
            throw new ArgumentNullException(nameof(code));

        var query = GetQuery(); // با SoftDelete

        if (includes != null && includes.Length > 0)
        {
            foreach (var include in includes)
            {
                if (!string.IsNullOrWhiteSpace(include))
                {
                    query = query.Include(include); // این خط ۱۰۰٪ کار می‌کنه در EF Core 6+
                }
            }
        }

        return await query.FirstOrDefaultAsync(e => e.Code == code);
    }

    public async Task<T?> GetByCodeWithIncludeAsync(string code, params Expression<Func<T, object>>[] includes)
    {
        if (string.IsNullOrEmpty(code)) throw new ArgumentNullException(nameof(code));

        var query = GetQuery();
        foreach (var include in includes ?? Array.Empty<Expression<Func<T, object>>>())
            query = query.Include(include);

        return await query.FirstOrDefaultAsync(e => e.Code == code);
    }
    #endregion

    #region گرفتن یک اطلاعات با شرط
    public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate)
    {
        if (predicate == null)
            throw new ArgumentNullException(nameof(predicate));

        return await _dbSet.FirstOrDefaultAsync(predicate);
    }
    #endregion

    #region اضافه کردن اطلاعات
    public async Task AddAsync(T entity)
    {
        if (entity == null)
            throw new ArgumentNullException(nameof(entity));

        await _dbSet.AddAsync(entity);
    }
    #endregion

    #region ویرایش اطلاعات
    public async Task<T> UpdateAsync(T entity)
    {
        if (entity == null)
            throw new ArgumentNullException(nameof(entity));

        if (entity is BaseEntity baseEntity)
        {
            baseEntity.UpdatedAt = DateTime.UtcNow;
        }

        var update =  _dbSet.Update(entity);
        return update.Entity;
    }
    #endregion

    #region حذف کامل داده
    public async Task DeleteAsync(T entity)
    {
        if (entity == null)
            throw new ArgumentNullException(nameof(entity));

        _dbSet.Remove(entity);
    }
    #endregion

    #region تغییر IsDelete
    public async Task LogicalDeleteAsync(T entity)
    {
        if (entity == null)
            throw new ArgumentNullException(nameof(entity));

        if (entity is BaseEntity baseEntity)
        {
            baseEntity.IsDeleted = true;
            baseEntity.UpdatedAt = DateTime.UtcNow;
            _dbSet.Update(entity);
        }
        else
        {
            throw new InvalidOperationException("Logical delete is only supported for entities inheriting from BaseEntity.");
        }
    }
    #endregion

    #region جست و جو برای وجود داشتن داده
    public async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
    {
        if (predicate == null)
            throw new ArgumentNullException(nameof(predicate));

        return await _dbSet.AnyAsync(predicate);
    }

    #endregion

}