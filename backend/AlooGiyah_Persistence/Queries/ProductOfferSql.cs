namespace AlooGiyah_Persistence.Queries;

internal static class ProductOfferSql
{
    public static string ActiveFor(string productAlias) => $$"""
SELECT o.* FROM "AgriculturalProductOffers" o
WHERE o."AgriculturalProductId"={{productAlias}}."AgriculturalProductId"
AND NOT o."IsDeleted" AND o."IsActive" AND o."Percentage">0 AND o."Percentage"<=100
AND o."StartsAt"<=statement_timestamp() AND o."EndsAt">statement_timestamp()
ORDER BY o."Percentage" DESC,o."AgriculturalProductOfferId" DESC LIMIT 1
""";
}
