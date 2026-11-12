using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Persistence.Queries;
public class AgriculturalOrderQuery : BaseQuery, IAgriculturalOrderQuery
{
    private readonly ICurrentUserService _user;
    private readonly AutoMapper.IMapper _mapper;
    public AgriculturalOrderQuery(IDbConnectionFactory factory, ICurrentUserService user, AutoMapper.IMapper mapper) : base(factory)
    { _user = user; _mapper = mapper; }
    private AgriculturalOrderDto Map(AlooGiyah_Domain.Entities.Store.AgriculturalOrder entity)
    {
        var dto = _mapper.Map<AgriculturalOrderDto>(entity);
        dto.AllowedActions = AlooGiyah_Application.Services.Store.AgriculturalOrderPolicy.AllowedActions(entity, QueryAccess.UserId(_user), QueryAccess.IsManager(_user));
        return dto;
    }
    public async Task<AgriculturalOrderDto?> GetByCodeAsync(string code)
    {
        var where = new QueryFilter(); var id = QueryAccess.UserId(_user);
        where.Add("t.\"Code\"=@Code", "Code", code);
        if (!QueryAccess.IsManager(_user)) where.Add("(t.\"BuyerId\"=@Id OR ((t.\"IsPaid\" OR t.\"IsHeld\" OR c.\"IsSubmitted\") AND f.\"OwnerId\"=@Id))", "Id", id);
        var entity = await QueryJsonFirstAsync<AlooGiyah_Domain.Entities.Store.AgriculturalOrder>($"SELECT ({AgriculturalOrderSql.Projection})::text {AgriculturalOrderSql.From} {where.Where}", where.Parameters);
        return entity == null ? null : Map(entity);
    }
    public async Task<PagedResult<AgriculturalOrderDto>> GetByFilterAsync(AgriculturalOrderFilterDto filter)
    {
        var where = new QueryFilter(); var id = QueryAccess.UserId(_user);
        switch (filter.View)
        {
            case "Buyer": where.Add("t.\"BuyerId\"=@Id", "Id", id); break;
            case "Seller": where.Add("f.\"OwnerId\"=@Id AND (t.\"IsPaid\" OR t.\"IsHeld\" OR c.\"IsSubmitted\")", "Id", id); break;
            case "Manager" when QueryAccess.IsManager(_user): break;
            default: throw new ForbiddenException("نوع نمایش مجاز نیست.");
        }
        if (!filter.IncludeUnpaid) where.Add("(t.\"IsPaid\" OR t.\"IsHeld\" OR c.\"IsSubmitted\")");
        where.Equal("u.\"Code\"", "Buyer", filter.UserCode); where.Equal("f.\"Code\"", "Farm", filter.FarmCode);
        where.Equal("s.\"Code\"", "Status", filter.StatusCode);
        if (!string.IsNullOrWhiteSpace(filter.ProductCode)) where.Add("EXISTS (SELECT 1 FROM \"AgriculturalOrderItems\" i WHERE i.\"AgriculturalOrderId\"=t.\"AgriculturalOrderId\" AND NOT i.\"IsDeleted\" AND i.\"ProductCodeSnapshot\"=@Product)", "Product", filter.ProductCode);
        where.Compare("t.\"TotalPrice\"", ">=", "Min", filter.MinTotalPrice); where.Compare("t.\"TotalPrice\"", "<=", "Max", filter.MaxTotalPrice);
        where.Compare("t.\"CreatedAt\"", ">=", "Start", filter.StartDate); where.Compare("t.\"CreatedAt\"", "<=", "End", filter.EndDate);
        var page = await QueryJsonPagedAsync<AlooGiyah_Domain.Entities.Store.AgriculturalOrder>(AgriculturalOrderSql.Projection, AgriculturalOrderSql.From, where, "t.\"CreatedAt\" DESC,t.\"AgriculturalOrderId\" DESC", filter.PageNumber, filter.PageSize);
        return new PagedResult<AgriculturalOrderDto> { Items = page.Items.Select(Map).ToList(), TotalCount = page.TotalCount, PageNumber = page.PageNumber, PageSize = page.PageSize };
    }
}
