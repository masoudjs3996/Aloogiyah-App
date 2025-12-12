using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Pagination;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace AlooGiyah_Domain.Interfaces;

public interface IServiceRequestRepository
{
    Task<PagedResult<ServiceRequest>> GetPagedAsync(
        Expression<Func<ServiceRequest, bool>>? filter,
        int pageNumber,
        int pageSize);

}