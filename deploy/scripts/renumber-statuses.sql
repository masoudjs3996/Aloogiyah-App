-- Fragment included inside finalize-statuses.sql's transaction, after normalization.
-- Run the generated finalize-statuses.sql, not this fragment by itself.
CREATE TEMP TABLE status_id_plan (
    code varchar(10) PRIMARY KEY, entity_type integer NOT NULL,
    final_id integer NOT NULL UNIQUE, old_id integer UNIQUE,
    temporary_id integer UNIQUE
) ON COMMIT DROP;
INSERT INTO status_id_plan(code,entity_type,final_id) VALUES
('631EE7CF1A',1,10),('22C82A6DC4',1,11),('42A1657DE4',1,12),
('70972F464D',1,13),('92494C9290',1,14),('3EFC703625',1,15),('84F424CD42',1,16),
('61AD6EEYSC',2,20),('HAQAG92G8N',2,21),('W2N6Q5ZHAD',2,22),('MCHS3J49VZ',2,23),
('59H5Z2H0M1',3,30),('1MAAQXHDR4',3,31),
('1A4ADD0E7B',5,50),('3C35A8EE55',5,51),('EB50C517D0',5,52),
('B334DF9B2E',5,53),('1EAB0D6EF2',5,54),
('A9ED0F97E4',6,60),('EA54D94863',6,61),
('251BC4A57D',7,70),('3A884D44E2',7,71),
('288E5EC830',8,80),('7E7324BC6C',8,81),('4B198425B3',8,82),
('14ACE65804',9,90),('49D4721587',9,91);

UPDATE status_id_plan p SET old_id=s."StatusId",temporary_id=-1000000-p.final_id
FROM public."Statuses" s WHERE s."Code"=p.code AND s."EntityStatus"=p.entity_type;
DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM status_id_plan WHERE old_id IS NULL)
       OR (SELECT count(*) FROM public."Statuses")<>27
       OR EXISTS(SELECT 1 FROM public."Statuses" WHERE "StatusId"<0) THEN
        RAISE EXCEPTION 'Unexpected statuses: cannot safely renumber';
    END IF;
END $$;

-- Temporarily remove only these foreign keys, while holding exclusive locks.
-- Restore their exact definitions and validate them before commit.
LOCK TABLE public."Statuses" IN ACCESS EXCLUSIVE MODE;
CREATE TEMP TABLE status_fk_definitions ON COMMIT DROP AS
SELECT fk.oid,ns.nspname AS schema_name,t.relname AS table_name,
       fk.conname AS constraint_name,col.attname AS column_name,
       pg_get_constraintdef(fk.oid,true) AS definition
FROM pg_constraint fk JOIN pg_class t ON t.oid=fk.conrelid
JOIN pg_namespace ns ON ns.oid=t.relnamespace
JOIN pg_attribute col ON col.attrelid=fk.conrelid AND col.attnum=fk.conkey[1]
WHERE fk.contype='f' AND fk.confrelid='public."Statuses"'::regclass;

DO $$ DECLARE r record; BEGIN
    FOR r IN SELECT DISTINCT schema_name,table_name FROM status_fk_definitions ORDER BY schema_name,table_name
    LOOP
        EXECUTE format('LOCK TABLE %I.%I IN ACCESS EXCLUSIVE MODE',r.schema_name,r.table_name);
    END LOOP;
    FOR r IN SELECT * FROM status_fk_definitions LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I',r.schema_name,r.table_name,r.constraint_name);
    END LOOP;

    UPDATE public."Statuses" s SET "StatusId"=p.temporary_id
    FROM status_id_plan p WHERE s."StatusId"=p.old_id;
    FOR r IN SELECT * FROM status_fk_definitions LOOP
        EXECUTE format('UPDATE %I.%I t SET %I=p.temporary_id FROM status_id_plan p WHERE t.%I=p.old_id',
            r.schema_name,r.table_name,r.column_name,r.column_name);
    END LOOP;
    UPDATE public."Statuses" s SET "StatusId"=p.final_id
    FROM status_id_plan p WHERE s."StatusId"=p.temporary_id;
    FOR r IN SELECT * FROM status_fk_definitions LOOP
        EXECUTE format('UPDATE %I.%I t SET %I=p.final_id FROM status_id_plan p WHERE t.%I=p.temporary_id',
            r.schema_name,r.table_name,r.column_name,r.column_name);
    END LOOP;
    FOR r IN SELECT * FROM status_fk_definitions LOOP
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I %s',
            r.schema_name,r.table_name,r.constraint_name,r.definition);
    END LOOP;
END $$;

-- Allocate future inserts by entity type, ignoring the identity sequence value.
-- Type 2: 20..29, then 200..299. Deleted IDs are not reused.
-- Type 0: 0..9, then 1000..1099 (integer 000..099 would collide with other types).
CREATE OR REPLACE FUNCTION public.allocate_status_id_by_type() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE candidate integer; BEGIN
    IF NEW."EntityStatus" NOT BETWEEN 0 AND 9 THEN
        RAISE EXCEPTION 'Unsupported EntityStatus for numbered ID ranges';
    END IF;
    PERFORM pg_advisory_xact_lock(14041102,NEW."EntityStatus");
    SELECT x.id INTO candidate FROM (
        SELECT n AS id,0 AS priority FROM generate_series(NEW."EntityStatus"*10,NEW."EntityStatus"*10+9)n
        UNION ALL
        SELECT n,1 FROM generate_series(
            CASE WHEN NEW."EntityStatus"=0 THEN 1000 ELSE NEW."EntityStatus"*100 END,
            CASE WHEN NEW."EntityStatus"=0 THEN 1099 ELSE NEW."EntityStatus"*100+99 END)n
    ) x WHERE NOT EXISTS(SELECT 1 FROM public."Statuses" s WHERE s."StatusId"=x.id)
    ORDER BY x.priority,x.id LIMIT 1;
    IF candidate IS NULL THEN RAISE EXCEPTION 'Status ID range is full for type %',NEW."EntityStatus"; END IF;
    NEW."StatusId" := candidate;
    RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS "TR_AllocateStatusId" ON public."Statuses";
CREATE TRIGGER "TR_AllocateStatusId" BEFORE INSERT ON public."Statuses"
FOR EACH ROW EXECUTE FUNCTION public.allocate_status_id_by_type();

-- Keep the numeric type stable after creation, so IDs cannot leave their range.
CREATE OR REPLACE FUNCTION public.keep_status_entity_type() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN
    IF NEW."EntityStatus" IS DISTINCT FROM OLD."EntityStatus" THEN
        RAISE EXCEPTION 'Status entity type cannot be changed; create a new status';
    END IF;
    RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS "TR_KeepStatusEntityType" ON public."Statuses";
CREATE TRIGGER "TR_KeepStatusEntityType" BEFORE UPDATE OF "EntityStatus" ON public."Statuses"
FOR EACH ROW EXECUTE FUNCTION public.keep_status_entity_type();

DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM status_id_plan p LEFT JOIN public."Statuses" s
        ON s."Code"=p.code AND s."StatusId"=p.final_id AND s."EntityStatus"=p.entity_type
        WHERE s."StatusId" IS NULL) THEN RAISE EXCEPTION 'Status renumbering verification failed'; END IF;
END $$;
