namespace AlooGiyah_Persistence.Queries;
internal static class AgriculturalOrderSql
{
    public const string Projection = """
to_jsonb(t) || jsonb_build_object('Buyer', jsonb_build_object('Code',u."Code",'UserId',u."UserId"), 'Status', to_jsonb(s), 'Farm', CASE WHEN f."FarmId" IS NULL THEN NULL ELSE jsonb_build_object('Code',f."Code",'OwnerId',f."OwnerId",'Owner',jsonb_build_object('UserId',f."OwnerId"),'Status',jsonb_build_object('StatusId',f."StatusId")) END, 'Checkout', CASE WHEN c."CheckoutId" IS NULL THEN NULL ELSE jsonb_build_object('Code',c."Code",'IsSubmitted',c."IsSubmitted",'IsPaid',c."IsPaid") END, 'Refund', (SELECT to_jsonb(r) FROM "OrderRefunds" r WHERE r."AgriculturalOrderId"=t."AgriculturalOrderId" AND NOT r."IsDeleted"), 'History', COALESCE((SELECT jsonb_agg(to_jsonb(h) ORDER BY h."CreatedAt",h."AgriculturalOrderHistoryId") FROM "AgriculturalOrderHistories" h WHERE h."AgriculturalOrderId"=t."AgriculturalOrderId" AND NOT h."IsDeleted"), '[]'::jsonb), 'AgriculturalOrderItems', COALESCE((SELECT jsonb_agg(to_jsonb(i) || jsonb_build_object('AgriculturalProduct', jsonb_build_object('Code',p."Code",'Name',p."Name",'Slug',p."Slug")) ORDER BY i."AgriculturalOrderItemId") FROM "AgriculturalOrderItems" i LEFT JOIN "AgriculturalProducts" p ON p."AgriculturalProductId"=i."AgriculturalProductId" WHERE i."AgriculturalOrderId"=t."AgriculturalOrderId" AND NOT i."IsDeleted"), '[]'::jsonb))
""";
    public const string From = """
FROM "AgriculturalOrders" t JOIN "Users" u ON u."UserId"=t."BuyerId" JOIN "Statuses" s ON s."StatusId"=t."StatusId" LEFT JOIN "Farms" f ON f."FarmId"=t."FarmId" LEFT JOIN "Checkouts" c ON c."CheckoutId"=t."CheckoutId"
""";
}
