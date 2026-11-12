-- LOCAL AlooGiyahDB, after the 1404 import. Stop the app and take a backup.
-- No business row is physically deleted. Invalid rows are archived/soft-deleted.
BEGIN;
SET LOCAL lock_timeout = '10s';
LOCK TABLE public."Provinces",public."Countys",public."Citys",public."Villages",
           public."Addresses",public."Farms" IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE legacy_cleanup_plan (
    kind integer, id integer, code text, PRIMARY KEY(kind,id)
) ON COMMIT DROP;
INSERT INTO legacy_cleanup_plan VALUES
(1,4,'D0V0000001'),(1,5,'D0V0000002'),(1,6,'D0V0000003'),(1,7,'D0V0000004'),
(2,3,'D0O0000001'),(2,4,'D0O0000002'),(2,5,'D0O0000003'),(2,6,'D0O0000004'),
(5,2,'C02C36FAE4'),(5,4,'D0Y0000001'),(5,5,'D0Y0000002'),
(5,6,'D0Y0000003'),(5,7,'D0Y0000004'),(6,1,'55D2C07042');

CREATE TEMP TABLE reviewed_address_plan (id integer PRIMARY KEY,code text) ON COMMIT DROP;
INSERT INTO reviewed_address_plan VALUES
(1,'ADF86F1353'),(2,'BC047EBDFD'),(44,'C276333B7F'),
(45,'8320F312EF'),(46,'655F895135'),
(79,'B7EYSTRWF7'),(80,'0HW7ED58PV');
INSERT INTO reviewed_address_plan
SELECT 54+n,'D0A'||lpad(n::text,7,'0') FROM generate_series(1,24) n;

CREATE TEMP VIEW cleanup_locations AS
SELECT 1 kind,"ProvinceId" id,"Code" code,"IsDeleted" deleted FROM public."Provinces"
UNION ALL SELECT 2,"CountyId","Code","IsDeleted" FROM public."Countys"
UNION ALL SELECT 5,"CityId","Code","IsDeleted" FROM public."Citys"
UNION ALL SELECT 6,"VillageId","Code","IsDeleted" FROM public."Villages";

DO $$ BEGIN
    IF (SELECT count(*) FROM iran_geo."ApplicationMap" WHERE year=1404) <> 101313 THEN
        RAISE EXCEPTION 'Complete 1404 import is required';
    END IF;
    IF EXISTS (SELECT 1 FROM legacy_cleanup_plan p
        LEFT JOIN cleanup_locations l ON l.kind=p.kind AND l.id=p.id
        WHERE l.id IS NULL OR l.code<>p.code) THEN
        RAISE EXCEPTION 'Legacy locations differ from the reviewed list';
    END IF;
    IF EXISTS (SELECT 1 FROM legacy_cleanup_plan p
        JOIN iran_geo."ApplicationMap" m ON m.year=1404 AND m.kind=p.kind AND m.app_id=p.id) THEN
        RAISE EXCEPTION 'A legacy target is a canonical location; refusing to archive';
    END IF;
    IF EXISTS (SELECT 1 FROM reviewed_address_plan p
        LEFT JOIN public."Addresses" a ON a."AddressId"=p.id
        WHERE a."AddressId" IS NULL OR a."Code"<>p.code) THEN
        RAISE EXCEPTION 'Addresses differ from the reviewed list';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS iran_geo."CleanupArchive" (
    batch text NOT NULL, entity text NOT NULL, row_id integer NOT NULL,
    original_row jsonb NOT NULL, archived_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY(batch,entity,row_id)
);

DO $$ DECLARE t record; BEGIN
    FOR t IN SELECT * FROM (VALUES
        (1,'Provinces','ProvinceId'),(2,'Countys','CountyId'),
        (5,'Citys','CityId'),(6,'Villages','VillageId')) v(kind,tbl,pk)
    LOOP
        EXECUTE format('INSERT INTO iran_geo."CleanupArchive"(batch,entity,row_id,original_row)
            SELECT %L,%L,r.%I,to_jsonb(r) FROM public.%I r
            JOIN legacy_cleanup_plan p ON p.kind=%s AND p.id=r.%I
            ON CONFLICT DO NOTHING',
            'legacy-locations-1404-v1',t.tbl,t.pk,t.tbl,t.kind,t.pk);
    END LOOP;
END $$;
INSERT INTO iran_geo."CleanupArchive"(batch,entity,row_id,original_row)
SELECT 'legacy-locations-1404-v1','Addresses',a."AddressId",to_jsonb(a)
FROM public."Addresses" a JOIN reviewed_address_plan p ON p.id=a."AddressId"
ON CONFLICT DO NOTHING;
INSERT INTO iran_geo."CleanupArchive"(batch,entity,row_id,original_row)
SELECT 'legacy-locations-1404-v1','Farms',f."FarmId",to_jsonb(f)
FROM public."Farms" f JOIN reviewed_address_plan p ON p.id=f."AddressId"
ON CONFLICT DO NOTHING;

CREATE TEMP TABLE cleanup_before_counts ON COMMIT DROP AS
SELECT (SELECT count(*) FROM public."Farms") farms,
       (SELECT count(*) FROM public."AgriculturalProducts") products,
       (SELECT count(*) FROM public."AgriculturalOrders") agricultural_orders,
       (SELECT count(*) FROM public."Orders") orders,
       (SELECT count(*) FROM public."Addresses") addresses;

-- Both reviewed Mashhad addresses agree on city and county; fix province only.
DO $$ BEGIN
    IF (SELECT count(*) FROM public."Addresses" a
        JOIN public."Countys" co ON co."CountyId"=a."CountyId"
        JOIN public."Citys" c ON c."CityId"=a."CityId" AND c."CountyId"=co."CountyId"
        JOIN public."Provinces" p ON p."ProvinceId"=co."ProvinceId"
        WHERE a."AddressId" IN (45,46) AND NOT a."IsDeleted" AND a."VillageId" IS NULL
          AND iran_geo.normal_name(c."Name")='مشهد'
          AND iran_geo.normal_name(co."Name")='مشهد'
          AND iran_geo.normal_name(p."Name")='خراسان رضوی'
          AND EXISTS(SELECT 1 FROM iran_geo."ApplicationMap" m
                     WHERE m.year=1404 AND m.kind=5 AND m.app_id=c."CityId")
          AND EXISTS(SELECT 1 FROM iran_geo."ApplicationMap" m
                     WHERE m.year=1404 AND m.kind=2 AND m.app_id=co."CountyId")
          AND EXISTS(SELECT 1 FROM iran_geo."ApplicationMap" m
                     WHERE m.year=1404 AND m.kind=1 AND m.app_id=p."ProvinceId")) <> 2 THEN
        RAISE EXCEPTION 'Reviewed Mashhad address details changed; refusing to guess';
    END IF;
    UPDATE public."Addresses" a SET "ProvinceId"=co."ProvinceId","UpdatedAt"=now()
    FROM public."Countys" co WHERE a."AddressId" IN (45,46)
      AND co."CountyId"=a."CountyId" AND a."ProvinceId" IS DISTINCT FROM co."ProvinceId";
END $$;

-- Merge the incorrectly-parented legacy Pakdasht city into the sourced city.
-- Source node 5766 is Pakdasht city; its county is source node 445.
DO $$ DECLARE chosen_city integer; chosen_county integer; chosen_province integer; BEGIN
    SELECT c."CityId",co."CountyId",co."ProvinceId"
      INTO STRICT chosen_city,chosen_county,chosen_province
    FROM iran_geo."ApplicationMap" m JOIN public."Citys" c ON c."CityId"=m.app_id
    JOIN public."Countys" co ON co."CountyId"=c."CountyId"
    WHERE m.year=1404 AND m.kind=5 AND m.source_id=5766
      AND iran_geo.normal_name(c."Name")='پاکدشت' AND NOT c."IsDeleted";
    IF EXISTS (SELECT 1 FROM public."Addresses" a WHERE a."CityId"=2
        AND NOT EXISTS(SELECT 1 FROM reviewed_address_plan p WHERE p.id=a."AddressId")) THEN
        RAISE EXCEPTION 'Unreviewed address uses legacy Pakdasht';
    END IF;
    UPDATE public."Addresses" SET "CityId"=chosen_city,"CountyId"=chosen_county,
        "ProvinceId"=chosen_province,"UpdatedAt"=now() WHERE "CityId"=2;
END $$;

-- Do not invent a match for Alouk: retain the known city/county, clear only village.
UPDATE public."Addresses" a SET "VillageId"=NULL,"UpdatedAt"=now()
WHERE a."VillageId"=1 AND EXISTS(SELECT 1 FROM reviewed_address_plan p WHERE p.id=a."AddressId");

CREATE TEMP TABLE invalid_address_targets ON COMMIT DROP AS
SELECT a."AddressId" AS id FROM public."Addresses" a
LEFT JOIN public."Countys" co ON co."CountyId"=a."CountyId"
LEFT JOIN public."Citys" c ON c."CityId"=a."CityId"
LEFT JOIN public."Villages" v ON v."VillageId"=a."VillageId"
WHERE NOT a."IsDeleted" AND (
    NOT EXISTS(SELECT 1 FROM iran_geo."ApplicationMap" m WHERE m.year=1404 AND m.kind=1 AND m.app_id=a."ProvinceId")
 OR NOT EXISTS(SELECT 1 FROM iran_geo."ApplicationMap" m WHERE m.year=1404 AND m.kind=2 AND m.app_id=a."CountyId")
 OR (a."CityId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM iran_geo."ApplicationMap" m WHERE m.year=1404 AND m.kind=5 AND m.app_id=a."CityId"))
 OR (a."VillageId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM iran_geo."ApplicationMap" m WHERE m.year=1404 AND m.kind=6 AND m.app_id=a."VillageId"))
 OR co."ProvinceId" IS DISTINCT FROM a."ProvinceId"
 OR (a."CityId" IS NOT NULL AND c."CountyId" IS DISTINCT FROM a."CountyId")
 OR (a."VillageId" IS NOT NULL AND v."CountyId" IS DISTINCT FROM a."CountyId")
);
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM invalid_address_targets t
        WHERE NOT EXISTS(SELECT 1 FROM reviewed_address_plan p WHERE p.id=t.id)) THEN
        RAISE EXCEPTION 'Additional invalid addresses were not reviewed; no changes saved';
    END IF;
END $$;

-- Keep historical orders linked to their address, but prevent new address use.
UPDATE public."Addresses" a SET "IsDeleted"=true,"IsDefault"=false,"UpdatedAt"=now()
FROM invalid_address_targets t WHERE a."AddressId"=t.id;
-- Farms remain; a user must enter a valid replacement address before delivery.
UPDATE public."Farms" f SET "AddressId"=NULL,"UpdatedAt"=now()
WHERE EXISTS(SELECT 1 FROM reviewed_address_plan p
             JOIN public."Addresses" a ON a."AddressId"=p.id
             WHERE a."IsDeleted" AND f."AddressId"=a."AddressId");

DO $$ DECLARE t record; BEGIN
    FOR t IN SELECT * FROM (VALUES
        (1,'Provinces','ProvinceId'),(2,'Countys','CountyId'),
        (5,'Citys','CityId'),(6,'Villages','VillageId')) v(kind,tbl,pk)
    LOOP
        EXECUTE format('UPDATE public.%I r SET "IsDeleted"=true,"UpdatedAt"=now()
            FROM legacy_cleanup_plan p WHERE p.kind=%s AND p.id=r.%I AND NOT r."IsDeleted"',
            t.tbl,t.kind,t.pk);
    END LOOP;
END $$;

DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM cleanup_before_counts b WHERE
        b.farms<>(SELECT count(*) FROM public."Farms")
     OR b.products<>(SELECT count(*) FROM public."AgriculturalProducts")
     OR b.agricultural_orders<>(SELECT count(*) FROM public."AgriculturalOrders")
     OR b.orders<>(SELECT count(*) FROM public."Orders")
     OR b.addresses<>(SELECT count(*) FROM public."Addresses")) THEN
        RAISE EXCEPTION 'Business record count changed; transaction aborted';
    END IF;
    IF EXISTS(SELECT 1 FROM cleanup_locations l
        LEFT JOIN iran_geo."ApplicationMap" m ON m.year=1404 AND m.kind=l.kind AND m.app_id=l.id
        WHERE NOT l.deleted AND m.source_id IS NULL) THEN
        RAISE EXCEPTION 'Unreviewed active legacy locations remain';
    END IF;
END $$;
DROP VIEW cleanup_locations;
COMMIT;

SELECT 'Province' AS "Type",count(*) FILTER(WHERE NOT "IsDeleted") AS "Active",
       count(*) FILTER(WHERE "IsDeleted") AS "Archived" FROM public."Provinces"
UNION ALL SELECT 'County',count(*) FILTER(WHERE NOT "IsDeleted"),count(*) FILTER(WHERE "IsDeleted") FROM public."Countys"
UNION ALL SELECT 'City',count(*) FILTER(WHERE NOT "IsDeleted"),count(*) FILTER(WHERE "IsDeleted") FROM public."Citys"
UNION ALL SELECT 'Village',count(*) FILTER(WHERE NOT "IsDeleted"),count(*) FILTER(WHERE "IsDeleted") FROM public."Villages";
