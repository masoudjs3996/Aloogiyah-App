-- Run in pgAdmin Query Tool connected to the LOCAL AlooGiyahDB.
-- Reads application tables; creates only a session-local temporary table.
-- Does not update or delete any application data.
BEGIN;

DROP TABLE IF EXISTS pg_temp.status_usage_audit;

CREATE TEMP TABLE status_usage_audit (
    status_id integer NOT NULL,
    reference_source text NOT NULL,
    reference_count bigint NOT NULL
) ON COMMIT PRESERVE ROWS;

DO $$
DECLARE
    ref record;
BEGIN
    FOR ref IN
        SELECT ns.nspname AS schema_name, tbl.relname AS table_name,
               col.attname AS column_name
        FROM pg_constraint fk
        JOIN pg_class tbl ON tbl.oid = fk.conrelid
        JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
        JOIN pg_attribute col ON col.attrelid = fk.conrelid
                             AND col.attnum = fk.conkey[1]
        JOIN pg_attribute target ON target.attrelid = fk.confrelid
                                AND target.attnum = fk.confkey[1]
        WHERE fk.contype = 'f'
          AND fk.confrelid = 'public."Statuses"'::regclass
          AND cardinality(fk.conkey) = 1
          AND target.attname = 'StatusId'
    LOOP
        EXECUTE format(
            'INSERT INTO status_usage_audit
             SELECT %I, %L, count(*) FROM %I.%I
             WHERE %I IS NOT NULL GROUP BY %I',
            ref.column_name,
            ref.schema_name || '.' || ref.table_name || '.' || ref.column_name,
            ref.schema_name, ref.table_name, ref.column_name, ref.column_name
        );
    END LOOP;
END $$;

COMMIT;

SELECT s."StatusId", s."Code", s."Name", s."EntityStatus", s."IsDeleted",
       COALESCE(sum(u.reference_count), 0)::bigint AS "ReferenceCount",
       string_agg(u.reference_source || ': ' || u.reference_count::text,
                  '; ' ORDER BY u.reference_source) AS "UsedBy"
FROM public."Statuses" s
LEFT JOIN status_usage_audit u ON u.status_id = s."StatusId"
GROUP BY s."StatusId", s."Code", s."Name", s."EntityStatus", s."IsDeleted"
ORDER BY s."EntityStatus", s."StatusId";
