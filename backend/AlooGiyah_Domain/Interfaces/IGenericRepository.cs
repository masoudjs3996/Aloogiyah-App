using AlooGiyah_Domain.Entities;
using System.Linq.Expressions;
using AlooGiyah_Domain.Pagination;

namespace AlooGiyah_Domain.Interfaces;

public interface IGenericRepository<T> where T : BaseEntity
{
    IQueryable<T> GetAll();
    IQueryable<T> GetAllIncludingDeleted();
    Task<IEnumerable<T>> GetAllAsync();
    Task<PagedResult<T>> GetPagedAsync(Expression<Func<T, bool>>? filter = null, int pageNumber = 1, int pageSize = 10, Expression<Func<T, object>>? orderBy = null);
    Task<PagedResult<T>> GetPagedWithIncludeAsync(Expression<Func<T, bool>>? filter = null, int pageNumber = 1, int pageSize = 10, Expression<Func<T, object>>? orderBy = null, params Expression<Func<T, object>>[] includes);
    Task<PagedResult<TResult>> GetPagedProjectedAsync<TResult>(
           Expression<Func<T, bool>>? filter = null,
           Expression<Func<T, TResult>> selector = null!,
           int pageNumber = 1,
           int pageSize = 10,
           Expression<Func<T, object>>? orderBy = null,
           bool orderByDescending = true, // اضافه شد!
           string[]? includes = null, // پشتیبانی از string includes
           params Expression<Func<T, object>>[] expressionIncludes);
    Task<T?> GetByIdAsync(int id);
    Task<T?> GetByCodeAsync(string code);
    Task<int?> GetIdByCodeAsync(string code, Expression<Func<T, int>> keySelector);
    Task<string?> GetCodeByIdAsync(int id);
    Task<T?> GetByCodeWithIncludeAsync(string code, params string[] includes);
    Task<T?> GetByCodeWithIncludeAsync(string code, params Expression<Func<T, object>>[] includes);
    Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);
    Task AddAsync(T entity);
    Task<T> UpdateAsync(T entity);
    Task DeleteAsync(T entity);
    Task LogicalDeleteAsync(T entity);
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);
}
