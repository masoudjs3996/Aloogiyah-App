using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations;

[DbContext(typeof(AlooGiyahDbContext))]
[Migration("20261007170000_EnforceUniqueEntityCodes")]
public partial class EnforceUniqueEntityCodes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "EntityCodeRegistry",
            columns: table => new
            {
                Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                EntityType = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_EntityCodeRegistry", x => x.Code));

        migrationBuilder.Sql("""
            CREATE OR REPLACE FUNCTION enforce_global_entity_code() RETURNS trigger AS $function$
            BEGIN
                IF TG_OP = 'UPDATE' AND NEW."Code" IS NOT DISTINCT FROM OLD."Code" THEN
                    RETURN NEW;
                END IF;

                INSERT INTO "EntityCodeRegistry" ("Code", "EntityType", "CreatedAt")
                VALUES (NEW."Code", TG_TABLE_NAME, NEW."CreatedAt");
                RETURN NEW;
            END;
            $function$ LANGUAGE plpgsql;
            """);

        migrationBuilder.Sql("""
            DO $$
            DECLARE entity_table record;
            DECLARE has_duplicates boolean;
            DECLARE union_query text;
            BEGIN
                SELECT string_agg(format('SELECT "Code" FROM %I', code_column.table_name), ' UNION ALL ')
                  INTO union_query
                FROM information_schema.columns code_column
                JOIN information_schema.columns deleted_column
                  ON deleted_column.table_schema = code_column.table_schema
                 AND deleted_column.table_name = code_column.table_name
                 AND deleted_column.column_name = 'IsDeleted'
                JOIN information_schema.tables entity_metadata
                  ON entity_metadata.table_schema = code_column.table_schema
                 AND entity_metadata.table_name = code_column.table_name
                 AND entity_metadata.table_type = 'BASE TABLE'
                WHERE code_column.table_schema = current_schema()
                  AND code_column.column_name = 'Code';

                EXECUTE 'SELECT EXISTS (SELECT 1 FROM (' || union_query || ') all_entity_codes GROUP BY "Code" HAVING COUNT(*) > 1)'
                    INTO has_duplicates;
                IF has_duplicates THEN
                    RAISE EXCEPTION 'Cannot enforce globally unique entity codes: duplicate Code values exist across entity tables';
                END IF;

                FOR entity_table IN
                    SELECT code_column.table_name
                    FROM information_schema.columns code_column
                    JOIN information_schema.columns deleted_column
                      ON deleted_column.table_schema = code_column.table_schema
                     AND deleted_column.table_name = code_column.table_name
                     AND deleted_column.column_name = 'IsDeleted'
                    JOIN information_schema.tables entity_metadata
                      ON entity_metadata.table_schema = code_column.table_schema
                     AND entity_metadata.table_name = code_column.table_name
                     AND entity_metadata.table_type = 'BASE TABLE'
                    WHERE code_column.table_schema = current_schema()
                      AND code_column.column_name = 'Code'
                    GROUP BY code_column.table_name
                LOOP
                    EXECUTE format(
                        'SELECT EXISTS (SELECT 1 FROM %I GROUP BY "Code" HAVING COUNT(*) > 1)',
                        entity_table.table_name
                    ) INTO has_duplicates;
                    IF has_duplicates THEN
                        RAISE EXCEPTION 'Cannot enforce unique entity codes: duplicate Code values exist in table %', entity_table.table_name;
                    END IF;
                END LOOP;

                FOR entity_table IN
                    SELECT code_column.table_name
                    FROM information_schema.columns code_column
                    JOIN information_schema.columns deleted_column
                      ON deleted_column.table_schema = code_column.table_schema
                     AND deleted_column.table_name = code_column.table_name
                     AND deleted_column.column_name = 'IsDeleted'
                    JOIN information_schema.tables entity_metadata
                      ON entity_metadata.table_schema = code_column.table_schema
                     AND entity_metadata.table_name = code_column.table_name
                     AND entity_metadata.table_type = 'BASE TABLE'
                    WHERE code_column.table_schema = current_schema()
                      AND code_column.column_name = 'Code'
                    GROUP BY code_column.table_name
                LOOP
                    EXECUTE format(
                        'INSERT INTO "EntityCodeRegistry" ("Code", "EntityType", "CreatedAt") SELECT "Code", %L, "CreatedAt" FROM %I',
                        entity_table.table_name,
                        entity_table.table_name
                    );
                    EXECUTE format('DROP INDEX IF EXISTS %I', 'IX_' || entity_table.table_name || '_Code_IsDeleted');
                    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I ("Code")', 'IX_' || entity_table.table_name || '_Code', entity_table.table_name);
                    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 'TR_ReserveEntityCode_' || entity_table.table_name, entity_table.table_name);
                    EXECUTE format(
                        'CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION enforce_global_entity_code()',
                        'TR_ReserveEntityCode_' || entity_table.table_name,
                        entity_table.table_name
                    );
                END LOOP;
            END $$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DO $$
            DECLARE entity_table record;
            BEGIN
                FOR entity_table IN
                    SELECT code_column.table_name
                    FROM information_schema.columns code_column
                    JOIN information_schema.columns deleted_column
                      ON deleted_column.table_schema = code_column.table_schema
                     AND deleted_column.table_name = code_column.table_name
                     AND deleted_column.column_name = 'IsDeleted'
                    JOIN information_schema.tables entity_metadata
                      ON entity_metadata.table_schema = code_column.table_schema
                     AND entity_metadata.table_name = code_column.table_name
                     AND entity_metadata.table_type = 'BASE TABLE'
                    WHERE code_column.table_schema = current_schema()
                      AND code_column.column_name = 'Code'
                    GROUP BY code_column.table_name
                LOOP
                    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 'TR_ReserveEntityCode_' || entity_table.table_name, entity_table.table_name);
                    IF entity_table.table_name <> 'Discounts' THEN
                        EXECUTE format('DROP INDEX IF EXISTS %I', 'IX_' || entity_table.table_name || '_Code');
                    END IF;
                    EXECUTE format(
                        'CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I ("Code", "IsDeleted")',
                        'IX_' || entity_table.table_name || '_Code_IsDeleted',
                        entity_table.table_name
                    );
                END LOOP;
                DROP FUNCTION IF EXISTS enforce_global_entity_code();
            END $$;
            """);
        migrationBuilder.DropTable(name: "EntityCodeRegistry");
    }
}
