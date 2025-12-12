using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Pagination;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using AlooGiyah_Persistence.Context;

namespace AlooGiyah_Persistence.Repositories
{
    public class ServiceRequestRepository: IServiceRequestRepository
    {
        private readonly AlooGiyahDbContext _context;

        public ServiceRequestRepository(AlooGiyahDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<ServiceRequest>> GetPagedAsync(
    Expression<Func<ServiceRequest, bool>>? filter,
    int pageNumber,
    int pageSize)
        {
            var query = _context.ServiceRequests.AsQueryable();

            if (filter != null)
                query = query.Where(filter);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderBy(sr => sr.servicedate ?? DateTime.MinValue)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<ServiceRequest>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }

    }
}
