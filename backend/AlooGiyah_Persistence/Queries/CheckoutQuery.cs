using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Persistence.Queries;
public class CheckoutQuery : BaseQuery, ICheckoutQuery
{
    private readonly ICurrentUserService _user;

    private readonly AutoMapper.IMapper _mapper;
    public CheckoutQuery(IDbConnectionFactory factory, ICurrentUserService user, AutoMapper.IMapper mapper) : base(factory) { _user = user; _mapper = mapper; }
    public async Task<CheckoutDto?> GetByCodeAsync(string code)
    {
        var id = QueryAccess.UserId(_user);
        var entity = await QueryJsonFirstAsync<AlooGiyah_Domain.Entities.Store.Checkout>("""
SELECT (to_jsonb(ch) || jsonb_build_object('Orders', COALESCE((SELECT jsonb_agg(to_jsonb(t) || jsonb_build_object('Buyer', jsonb_build_object('Code',u."Code",'UserId',u."UserId"), 'Status', to_jsonb(s), 'Farm', CASE WHEN f."FarmId" IS NULL THEN NULL ELSE jsonb_build_object('Code',f."Code",'OwnerId',f."OwnerId",'Owner',jsonb_build_object('UserId',f."OwnerId"),'Status',jsonb_build_object('StatusId',f."StatusId")) END, 'Checkout', CASE WHEN c."CheckoutId" IS NULL THEN NULL ELSE jsonb_build_object('Code',c."Code",'IsSubmitted',c."IsSubmitted",'IsPaid',c."IsPaid") END, 'Refund', (SELECT to_jsonb(r) FROM "OrderRefunds" r WHERE r."AgriculturalOrderId"=t."AgriculturalOrderId" AND NOT r."IsDeleted"), 'History', COALESCE((SELECT jsonb_agg(to_jsonb(h) ORDER BY h."CreatedAt",h."AgriculturalOrderHistoryId") FROM "AgriculturalOrderHistories" h WHERE h."AgriculturalOrderId"=t."AgriculturalOrderId" AND NOT h."IsDeleted"), '[]'::jsonb), 'AgriculturalOrderItems', COALESCE((SELECT jsonb_agg(to_jsonb(i) || jsonb_build_object('AgriculturalProduct', jsonb_build_object('Code',p."Code",'Name',p."Name",'Slug',p."Slug")) ORDER BY i."AgriculturalOrderItemId") FROM "AgriculturalOrderItems" i LEFT JOIN "AgriculturalProducts" p ON p."AgriculturalProductId"=i."AgriculturalProductId" WHERE i."AgriculturalOrderId"=t."AgriculturalOrderId" AND NOT i."IsDeleted"), '[]'::jsonb)) ORDER BY t."AgriculturalOrderId") FROM "AgriculturalOrders" t JOIN "Users" u ON u."UserId"=t."BuyerId" JOIN "Statuses" s ON s."StatusId"=t."StatusId" LEFT JOIN "Farms" f ON f."FarmId"=t."FarmId" LEFT JOIN "Checkouts" c ON c."CheckoutId"=t."CheckoutId" WHERE t."CheckoutId"=ch."CheckoutId" AND NOT t."IsDeleted"), '[]'::jsonb)))::text FROM "Checkouts" ch WHERE NOT ch."IsDeleted" AND ch."BuyerId"=@Id AND ch."Code"=@Code
""", new { Id = id, Code = code });
        if (entity == null) return null;
        var dto = _mapper.Map<CheckoutDto>(entity);
        for (var i = 0; i < entity.Orders.Count; i++) dto.Orders[i].AllowedActions = AlooGiyah_Application.Services.Store.AgriculturalOrderPolicy.AllowedActions(entity.Orders[i], id, QueryAccess.IsManager(_user));
        return dto;
    }
}
