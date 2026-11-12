-- Read-only audit of application locations not mapped to the 1404 source.
-- Temporary tables are session-local; no application rows are changed.
BEGIN;
DROP TABLE IF EXISTS pg_temp.legacy_locations;
DROP TABLE IF EXISTS pg_temp.legacy_location_usage;

CREATE TEMP TABLE legacy_locations ON COMMIT PRESERVE ROWS AS
SELECT 'public."Provinces"'::regclass AS relation, 'ProvinceId'::text AS key_column,
       1 AS kind, 'Province'::text AS location_type,
       p."ProvinceId" AS id, p."Code" AS code, p."Name" AS name,
       NULL::text AS parent_name, p."IsDeleted" AS deleted
FROM public."Provinces" p
WHERE NOT EXISTS (SELECT 1 FROM iran_geo."ApplicationMap" m
                  WHERE m.year=1404 AND m.kind=1 AND m.app_id=p."ProvinceId")
UNION ALL
SELECT 'public."Countys"'::regclass,'CountyId',2,'County',
       c."CountyId",c."Code",c."Name",p."Name",c."IsDeleted"
FROM public."Countys" c JOIN public."Provinces" p ON p."ProvinceId"=c."ProvinceId"
WHERE NOT EXISTS (SELECT 1 FROM iran_geo."ApplicationMap" m
                  WHERE m.year=1404 AND m.kind=2 AND m.app_id=c."CountyId")
UNION ALL
SELECT 'public."Citys"'::regclass,'CityId',5,'City',
       c."CityId",c."Code",c."Name",p."Name" || ' / ' || county."Name",c."IsDeleted"
FROM public."Citys" c JOIN public."Countys" county ON county."CountyId"=c."CountyId"
JOIN public."Provinces" p ON p."ProvinceId"=county."ProvinceId"
WHERE NOT EXISTS (SELECT 1 FROM iran_geo."ApplicationMap" m
                  WHERE m.year=1404 AND m.kind=5 AND m.app_id=c."CityId")
UNION ALL
SELECT 'public."Villages"'::regclass,'VillageId',6,'Village',
       v."VillageId",v."Code",v."Name",p."Name" || ' / ' || county."Name",v."IsDeleted"
FROM public."Villages" v JOIN public."Countys" county ON county."CountyId"=v."CountyId"
JOIN public."Provinces" p ON p."ProvinceId"=county."ProvinceId"
WHERE NOT EXISTS (SELECT 1 FROM iran_geo."ApplicationMap" m
                  WHERE m.year=1404 AND m.kind=6 AND m.app_id=v."VillageId");

CREATE TEMP TABLE legacy_location_usage (
    relation oid, id integer, source text, record_count bigint
) ON COMMIT PRESERVE ROWS;

DO $$ DECLARE ref record;
BEGIN
    FOR ref IN
        SELECT DISTINCT fk.confrelid AS target_relation,
               ns.nspname AS schema_name, tbl.relname AS table_name,
               col.attname AS column_name
        FROM pg_constraint fk
        JOIN pg_class tbl ON tbl.oid=fk.conrelid
        JOIN pg_namespace ns ON ns.oid=tbl.relnamespace
        JOIN pg_attribute col ON col.attrelid=fk.conrelid AND col.attnum=fk.conkey[1]
        JOIN pg_attribute dest ON dest.attrelid=fk.confrelid AND dest.attnum=fk.confkey[1]
        JOIN legacy_locations l ON l.relation=fk.confrelid AND l.key_column=dest.attname
        WHERE fk.contype='f' AND cardinality(fk.conkey)=1
    LOOP
        EXECUTE format(
            'INSERT INTO legacy_location_usage
             SELECT l.relation,l.id,%L,count(*) FROM %I.%I r
             JOIN legacy_locations l ON l.relation=%s AND l.id=r.%I
             GROUP BY l.relation,l.id',
             ref.schema_name || '.' || ref.table_name || '.' || ref.column_name,
             ref.schema_name,ref.table_name,ref.target_relation::oid,ref.column_name);
    END LOOP;
END $$;
COMMIT;

SELECT l.location_type AS "Type",l.id AS "Id",l.code AS "Code",l.name AS "Name",
       l.parent_name AS "Parent",l.deleted AS "IsDeleted",
       COALESCE(sum(u.record_count),0)::bigint AS "ReferenceCount",
       string_agg(u.source || ': ' || u.record_count::text,'; ' ORDER BY u.source) AS "UsedBy"
FROM legacy_locations l LEFT JOIN legacy_location_usage u
ON u.relation=l.relation AND u.id=l.id
GROUP BY l.kind,l.location_type,l.id,l.code,l.name,l.parent_name,l.deleted
ORDER BY l.kind,l.id;
