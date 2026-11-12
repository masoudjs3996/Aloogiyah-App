-- Read-only: address IDs and dependency counts, without private address details.
SELECT a."AddressId", a."Code", a."IsDeleted",
       (SELECT count(*) FROM public."Farms" f
        WHERE f."AddressId"=a."AddressId") AS "Farms",
       (SELECT count(*) FROM public."ServiceRequests" r
        WHERE r."AddressId"=a."AddressId") AS "ServiceRequests",
       (SELECT count(*) FROM public."Orders" o
        WHERE o."AddressId"=a."AddressId") AS "Orders",
       (SELECT count(*) FROM public."AgriculturalOrders" o
        WHERE o."AddressId"=a."AddressId") AS "AgriculturalOrders",
       (SELECT count(*) FROM public."AgriculturalOrders" o
        WHERE o."AddressId"=a."AddressId"
          AND (o."IsPaid" OR o."IsHeld" OR o."HeldAmount">0)) AS "PaidOrHeldOrders"
FROM public."Addresses" a
WHERE NOT EXISTS (SELECT 1 FROM iran_geo."ApplicationMap" m
                  WHERE m.year=1404 AND m.kind=1 AND m.app_id=a."ProvinceId")
   OR NOT EXISTS (SELECT 1 FROM iran_geo."ApplicationMap" m
                  WHERE m.year=1404 AND m.kind=2 AND m.app_id=a."CountyId")
   OR (a."CityId" IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM iran_geo."ApplicationMap" m
       WHERE m.year=1404 AND m.kind=5 AND m.app_id=a."CityId"))
   OR (a."VillageId" IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM iran_geo."ApplicationMap" m
       WHERE m.year=1404 AND m.kind=6 AND m.app_id=a."VillageId"))
ORDER BY a."AddressId";
