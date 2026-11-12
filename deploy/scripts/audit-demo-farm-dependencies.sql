-- LOCAL AlooGiyahDB: inspect dependencies, including soft-deleted records.
-- Does not modify application data. The final SELECT returns the result grid.
BEGIN;
DROP TABLE IF EXISTS pg_temp.demo_farm_targets;
DROP TABLE IF EXISTS pg_temp.demo_product_targets;
DROP TABLE IF EXISTS pg_temp.demo_dependency_report;

CREATE TEMP TABLE demo_farm_targets ON COMMIT PRESERVE ROWS AS
SELECT "FarmId" AS id FROM public."Farms"
WHERE "FarmId" BETWEEN 13 AND 24
  AND "Code" = 'D0F' || lpad(("FarmId" - 12)::text, 7, '0');

CREATE TEMP TABLE demo_product_targets ON COMMIT PRESERVE ROWS AS
SELECT "AgriculturalProductId" AS id
FROM public."AgriculturalProducts"
WHERE "FarmId" IN (SELECT id FROM demo_farm_targets);

CREATE TEMP TABLE demo_dependency_report (
    target text, source text, record_count bigint
) ON COMMIT PRESERVE ROWS;

INSERT INTO demo_dependency_report
SELECT 'Selected farms', 'public.Farms', count(*) FROM demo_farm_targets
UNION ALL
SELECT 'Selected products', 'public.AgriculturalProducts', count(*)
FROM demo_product_targets;

DO $$
DECLARE ref record;
BEGIN
    FOR ref IN
        SELECT ns.nspname AS schema_name, tbl.relname AS table_name,
               col.attname AS column_name,
               CASE WHEN fk.confrelid = 'public."Farms"'::regclass
                    THEN 'demo_farm_targets' ELSE 'demo_product_targets' END AS target_table,
               CASE WHEN fk.confrelid = 'public."Farms"'::regclass
                    THEN 'Farm' ELSE 'Product' END AS target_label
        FROM pg_constraint fk
        JOIN pg_class tbl ON tbl.oid = fk.conrelid
        JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
        JOIN pg_attribute col ON col.attrelid = fk.conrelid
                             AND col.attnum = fk.conkey[1]
        JOIN pg_attribute dest ON dest.attrelid = fk.confrelid
                              AND dest.attnum = fk.confkey[1]
        WHERE fk.contype = 'f' AND cardinality(fk.conkey) = 1
          AND ((fk.confrelid = 'public."Farms"'::regclass AND dest.attname = 'FarmId')
            OR (fk.confrelid = 'public."AgriculturalProducts"'::regclass
                AND dest.attname = 'AgriculturalProductId'))
    LOOP
        EXECUTE format(
            'INSERT INTO demo_dependency_report
             SELECT %L, %L, count(*) FROM %I.%I r
             JOIN pg_temp.%I t ON r.%I = t.id',
            ref.target_label,
            ref.schema_name || '.' || ref.table_name || '.' || ref.column_name,
            ref.schema_name, ref.table_name, ref.target_table, ref.column_name
        );
    END LOOP;
END $$;
COMMIT;

SELECT target AS "Target", source AS "ReferencedBy", record_count AS "Count"
FROM demo_dependency_report ORDER BY target, source;
