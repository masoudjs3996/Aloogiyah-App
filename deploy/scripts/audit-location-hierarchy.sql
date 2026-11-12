-- Read-only: reveal previously unreviewed hierarchy conflicts.
-- No street, postal code, contact details or credentials are selected.
SELECT a."AddressId",a."Code",a."IsDeleted",
       p."Name" AS "SelectedProvince",co."Name" AS "SelectedCounty",
       c."Name" AS "SelectedCity",v."Name" AS "SelectedVillage",
       cp."Name" AS "CountyActualProvince",
       cc."Name" AS "CityActualCounty",ccp."Name" AS "CityActualProvince",
       vc."Name" AS "VillageActualCounty",vcp."Name" AS "VillageActualProvince",
       (SELECT count(*) FROM public."Farms" f WHERE f."AddressId"=a."AddressId") AS "Farms",
       (SELECT count(*) FROM public."AgriculturalOrders" o WHERE o."AddressId"=a."AddressId") AS "AgriculturalOrders",
       (SELECT count(*) FROM public."Orders" o WHERE o."AddressId"=a."AddressId") AS "Orders",
       (SELECT count(*) FROM public."ServiceRequests" r WHERE r."AddressId"=a."AddressId") AS "ServiceRequests"
FROM public."Addresses" a
LEFT JOIN public."Provinces" p ON p."ProvinceId"=a."ProvinceId"
LEFT JOIN public."Countys" co ON co."CountyId"=a."CountyId"
LEFT JOIN public."Provinces" cp ON cp."ProvinceId"=co."ProvinceId"
LEFT JOIN public."Citys" c ON c."CityId"=a."CityId"
LEFT JOIN public."Countys" cc ON cc."CountyId"=c."CountyId"
LEFT JOIN public."Provinces" ccp ON ccp."ProvinceId"=cc."ProvinceId"
LEFT JOIN public."Villages" v ON v."VillageId"=a."VillageId"
LEFT JOIN public."Countys" vc ON vc."CountyId"=v."CountyId"
LEFT JOIN public."Provinces" vcp ON vcp."ProvinceId"=vc."ProvinceId"
WHERE NOT a."IsDeleted"
  AND a."AddressId" NOT IN (1,2,44,79,80)
  AND a."AddressId" NOT BETWEEN 55 AND 78
  AND (co."ProvinceId" IS DISTINCT FROM a."ProvinceId"
    OR (a."CityId" IS NOT NULL AND c."CountyId" IS DISTINCT FROM a."CountyId")
    OR (a."VillageId" IS NOT NULL AND v."CountyId" IS DISTINCT FROM a."CountyId"))
ORDER BY a."AddressId";
