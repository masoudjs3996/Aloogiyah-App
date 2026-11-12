-- LOCAL AlooGiyahDB only. Keep the original pre-deployment backup.
-- Stop the local application while applying and making the new backup.
-- Keeps farms, products and other business records; remaps redundant statuses.
-- Merges status 0 -> 91, 99 -> 51, 100 -> 61 using declared foreign keys.
-- Fixed replacement codes make repeated execution safe.
BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE public."Statuses" IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE status_merge_plan (
    source_id integer PRIMARY KEY,
    target_id integer NOT NULL,
    entity_type integer NOT NULL,
    old_code text NOT NULL,
    previous_replacement text NOT NULL,
    target_code text NOT NULL
) ON COMMIT DROP;

INSERT INTO status_merge_plan VALUES
(0,91,9,'1234567890','DTAZDGET6C','14ACE65804'),
(99,51,5,'D0S0000007','36964F77SN','1A4ADD0E7B'),
(100,61,6,'D0S0000008','6MDMPYY698','A9ED0F97E4');

CREATE TEMP TABLE status_cleanup_counts ON COMMIT DROP AS
SELECT (SELECT count(*) FROM public."Farms") AS farms,
       (SELECT count(*) FROM public."AgriculturalProducts") AS products;

CREATE TEMP TABLE status_normalization_plan (
    id integer PRIMARY KEY,
    entity_type integer NOT NULL,
    old_code text NOT NULL UNIQUE,
    new_code text NOT NULL UNIQUE,
    title text NOT NULL,
    description text NOT NULL
) ON COMMIT DROP;

INSERT INTO status_normalization_plan VALUES
(1,1,'631EE7CF1A','631EE7CF1A','در حال بررسی','سفارش در انتظار بررسی فروشنده و تأیید موجودی محصولات است.'),
(2,1,'22C82A6DC4','22C82A6DC4','تأیید سفارش','فروشنده سفارش و موجودی موردنیاز برای تأمین آن را تأیید کرده است.'),
(3,1,'42A1657DE4','42A1657DE4','ارسال سفارش','سفارش از مبدأ ارسال شده و در مسیر تحویل به خریدار است.'),
(4,1,'70972F464D','70972F464D','تحویل سفارش','سفارش به مقصد رسیده و تحویل آن ثبت شده است.'),
(5,1,'92494C9290','92494C9290','لغو سفارش','سفارش لغو شده یا فروشنده آن را رد کرده است؛ علت در سوابق سفارش ثبت می‌شود.'),
(6,1,'3EFC703625','3EFC703625','در انتظار پرداخت','سفارش منتظر تکمیل پرداخت توسط خریدار است.'),
(7,1,'84F424CD42','84F424CD42','اشکال در پرداخت','پرداخت سفارش با خطا مواجه شده یا تکمیل آن تأیید نشده است.'),
(93,2,'D0S0000001','61AD6EEYSC','در انتظار تخصیص','درخواست خدمت ثبت شده و منتظر تخصیص کارشناس یا ارائه‌دهنده خدمت است.'),
(94,2,'D0S0000002','HAQAG92G8N','در حال انجام','رسیدگی به درخواست خدمت توسط کارشناس یا ارائه‌دهنده در حال انجام است.'),
(95,2,'D0S0000003','W2N6Q5ZHAD','انجام شده','انجام خدمت و پایان رسیدگی به درخواست ثبت شده است.'),
(96,2,'D0S0000004','MCHS3J49VZ','لغو شده','درخواست خدمت لغو شده و در این وضعیت فعال محسوب نمی‌شود.'),
(97,3,'D0S0000005','59H5Z2H0M1','در حال برگزاری','وضعیت مربوط به حراج باز و در حال برگزاری است؛ محدودیت زمانی حراج نیز جداگانه بررسی می‌شود.'),
(98,3,'D0S0000006','1MAAQXHDR4','پایان یافته','برگزاری حراج پایان یافته است؛ نتیجه و تسویه آن در اطلاعات مربوط به حراج نگهداری می‌شود.'),
(51,5,'1A4ADD0E7B','1A4ADD0E7B','دسته‌بندی فعال','وضعیت فعال دسته‌بندی؛ با وضعیت‌های نمایش در منو، صفحه اصلی و بخش ویژه یکسان نیست.'),
(52,5,'3C35A8EE55','3C35A8EE55','دسته‌بندی غیرفعال','وضعیت غیرفعال دسته‌بندی.'),
(53,5,'EB50C517D0','EB50C517D0','دسته‌بندی صفحه اصلی','وضعیت دسته‌بندی‌های در نظر گرفته‌شده برای نمایش در صفحه اصلی.'),
(54,5,'B334DF9B2E','B334DF9B2E','دسته‌بندی منو','وضعیت دسته‌بندی‌های در نظر گرفته‌شده برای نمایش در منو.'),
(55,5,'1EAB0D6EF2','1EAB0D6EF2','دسته‌بندی ویژه','وضعیت دسته‌بندی‌های در نظر گرفته‌شده برای بخش ویژه.'),
(61,6,'A9ED0F97E4','A9ED0F97E4','منطقه جغرافیایی فعال','وضعیت فعال برای استان، شهرستان، شهر یا روستا.'),
(62,6,'EA54D94863','EA54D94863','منطقه جغرافیایی غیرفعال','وضعیت غیرفعال برای استان، شهرستان، شهر یا روستا.'),
(71,7,'251BC4A57D','251BC4A57D','محصول کشاورزی فعال','وضعیت فعال محصول کشاورزی؛ سایر شروط عرضه و موجودی به‌صورت جداگانه بررسی می‌شوند.'),
(72,7,'3A884D44E2','3A884D44E2','محصول کشاورزی غیرفعال','وضعیت غیرفعال محصول کشاورزی؛ برای فعال‌سازی نیازمند تغییر وضعیت توسط کاربر مجاز است.'),
(81,8,'288E5EC830','288E5EC830','نظر در انتظار تأیید','نظر ثبت شده و منتظر بررسی و تأیید کاربر مجاز است.'),
(82,8,'7E7324BC6C','7E7324BC6C','نظر تأییدشده','نظر بررسی و تأیید شده است.'),
(83,8,'4B198425B3','4B198425B3','نظر ردشده','نظر در بررسی رد شده و تأیید انتشار ندارد.'),
(91,9,'14ACE65804','14ACE65804','مزرعه عادی','وضعیت عادی مزرعه، متمایز از وضعیت مزرعه ویژه.'),
(92,9,'49D4721587','49D4721587','مزرعه ویژه','وضعیت مزارع ویژه در نظر گرفته‌شده برای نمایش در بخش ویژه صفحه اصلی.');

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM status_merge_plan p
        LEFT JOIN public."Statuses" t ON t."StatusId" = p.target_id
        LEFT JOIN public."Statuses" s ON s."StatusId" = p.source_id
        WHERE t."StatusId" IS NULL OR t."IsDeleted"
           OR t."EntityStatus" <> p.entity_type OR t."Code" <> p.target_code
           OR (s."StatusId" IS NOT NULL AND
               (s."EntityStatus" <> p.entity_type
                OR s."Code" NOT IN (p.old_code, p.previous_replacement)))
    ) THEN
        RAISE EXCEPTION 'Merge source or target differs from the reviewed data.';
    END IF;
    IF EXISTS (
        SELECT 1 FROM status_normalization_plan p
        LEFT JOIN public."Statuses" s ON s."StatusId" = p.id
        WHERE s."StatusId" IS NULL OR s."IsDeleted"
           OR s."EntityStatus" <> p.entity_type
           OR s."Code" NOT IN (p.old_code, p.new_code)
    ) THEN
        RAISE EXCEPTION 'Status data differs from the reviewed plan. No changes applied.';
    END IF;
    IF EXISTS (
        SELECT 1 FROM status_normalization_plan p
        JOIN public."Statuses" s ON s."Code" = p.new_code
        WHERE s."StatusId" <> p.id
    ) THEN
        RAISE EXCEPTION 'Replacement code already belongs to another status. No changes applied.';
    END IF;
END $$;

-- Refuse unexpected composite/code-based foreign keys rather than guessing.
DO $$
DECLARE ref record;
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint fk
        WHERE fk.contype = 'f' AND fk.confrelid = 'public."Statuses"'::regclass
          AND (cardinality(fk.conkey) <> 1 OR fk.confkey <> ARRAY[
              (SELECT attnum FROM pg_attribute
               WHERE attrelid = 'public."Statuses"'::regclass AND attname = 'StatusId')
          ]::smallint[])
    ) THEN
        RAISE EXCEPTION 'Unexpected status foreign key. Review before merging.';
    END IF;

    FOR ref IN
        SELECT ns.nspname AS schema_name, tbl.relname AS table_name,
               col.attname AS column_name
        FROM pg_constraint fk
        JOIN pg_class tbl ON tbl.oid = fk.conrelid
        JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
        JOIN pg_attribute col ON col.attrelid = fk.conrelid
                             AND col.attnum = fk.conkey[1]
        WHERE fk.contype = 'f' AND fk.confrelid = 'public."Statuses"'::regclass
    LOOP
        EXECUTE format(
            'UPDATE %I.%I r SET %I = p.target_id
             FROM pg_temp.status_merge_plan p WHERE r.%I = p.source_id',
            ref.schema_name, ref.table_name, ref.column_name, ref.column_name
        );
    END LOOP;
END $$;

-- No CASCADE: any unhandled dependency must abort the whole transaction.
DELETE FROM public."Statuses" s
USING status_merge_plan p WHERE s."StatusId" = p.source_id;

UPDATE public."Statuses" s
SET "Code" = p.new_code,
    "Name" = p.title,
    "Description" = p.description,
    "UpdatedAt" = CURRENT_TIMESTAMP
FROM status_normalization_plan p
WHERE s."StatusId" = p.id
  AND (s."Code", s."Name", s."Description")
      IS DISTINCT FROM (p.new_code, p.title, p.description);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM status_cleanup_counts
        WHERE farms <> (SELECT count(*) FROM public."Farms")
           OR products <> (SELECT count(*) FROM public."AgriculturalProducts")
    ) THEN
        RAISE EXCEPTION 'Farm/product counts changed unexpectedly. Rolling back.';
    END IF;
END $$;

COMMIT;

-- Last statement deliberately returns a result grid in pgAdmin.
SELECT "StatusId", "Code", "Name", "EntityStatus", "Description", "IsDeleted"
FROM public."Statuses"
ORDER BY "EntityStatus", "StatusId";
