using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace AlooGiyah_Persistence.Migrations;

[DbContext(typeof(AlooGiyahDbContext))]
[Migration("20261107130000_RequireOrderItems")]
public class RequireOrderItems : Migration
{
    private const string Unpaid = """
        NOT o."IsPaid" AND o."PaymentDate" IS NULL AND COALESCE(BTRIM(o."PaymentReference"), '') = ''
        """;

    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(Guard("Order", Unpaid));
        migrationBuilder.Sql(Guard("AgriculturalOrder", Unpaid + """

            AND o."CheckoutId" IS NULL AND NOT o."IsHeld" AND o."HeldAmount" = 0 AND NOT o."InventoryReserved"
            AND NOT EXISTS (SELECT 1 FROM "OrderRefunds" r WHERE r."AgriculturalOrderId" = o."AgriculturalOrderId")
            AND NOT EXISTS (SELECT 1 FROM "SellerReceivables" r WHERE r."AgriculturalOrderId" = o."AgriculturalOrderId")
            """));
    }

    private static string Guard(string order, string canArchive) => $$"""
        UPDATE "{{order}}s" o SET "IsDeleted" = TRUE, "UpdatedAt" = now()
        WHERE NOT o."IsDeleted" AND {{canArchive}} AND NOT EXISTS (
            SELECT 1 FROM "{{order}}Items" i
            WHERE i."{{order}}Id" = o."{{order}}Id" AND NOT i."IsDeleted" AND i."Quantity" > 0
        );

        CREATE FUNCTION "{{order}}_require_items"() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE parent_id integer;
        BEGIN
            IF TG_ARGV[0] = 'item' THEN
                IF OLD."IsDeleted" OR OLD."Quantity" <= 0 THEN RETURN NULL; END IF;
                IF TG_OP = 'UPDATE' THEN
                    IF NEW."{{order}}Id" = OLD."{{order}}Id" AND NOT NEW."IsDeleted" AND NEW."Quantity" > 0 THEN
                        RETURN NULL;
                    END IF;
                END IF;
                parent_id := OLD."{{order}}Id";
                -- Serialize concurrent removals from the same order even if both remove different items.
                UPDATE "{{order}}s" SET "UpdatedAt" = "UpdatedAt"
                WHERE "{{order}}Id" = parent_id AND NOT "IsDeleted";
                IF NOT FOUND THEN RETURN NULL; END IF;
            ELSE
                IF TG_OP = 'UPDATE' THEN
                    IF NOT OLD."IsDeleted" THEN RETURN NULL; END IF;
                END IF;
                parent_id := NEW."{{order}}Id";
            END IF;

            IF NOT EXISTS (SELECT 1 FROM "{{order}}s" o WHERE o."{{order}}Id" = parent_id AND NOT o."IsDeleted")
                OR EXISTS (SELECT 1 FROM "{{order}}Items" i
                    WHERE i."{{order}}Id" = parent_id AND NOT i."IsDeleted" AND i."Quantity" > 0) THEN
                RETURN NULL;
            END IF;

            IF TG_ARGV[0] = 'item' THEN
                UPDATE "{{order}}s" o SET "IsDeleted" = TRUE, "UpdatedAt" = now()
                WHERE o."{{order}}Id" = parent_id AND {{canArchive}};
                IF FOUND THEN RETURN NULL; END IF;
            END IF;
            RAISE EXCEPTION 'An active order must have at least one active item'
                USING ERRCODE = '23514', CONSTRAINT = 'CK_{{order}}_ActiveItems';
        END;
        $$;

        CREATE CONSTRAINT TRIGGER "{{order}}_require_items"
            AFTER INSERT OR UPDATE OF "IsDeleted" ON "{{order}}s"
            DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "{{order}}_require_items"('order');
        CREATE CONSTRAINT TRIGGER "{{order}}_require_items"
            AFTER DELETE OR UPDATE OF "{{order}}Id", "IsDeleted", "Quantity" ON "{{order}}Items"
            DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "{{order}}_require_items"('item');
        """;

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        foreach (var order in new[] { "Order", "AgriculturalOrder" })
        {
            migrationBuilder.Sql($"""
                DROP TRIGGER "{order}_require_items" ON "{order}Items";
                DROP TRIGGER "{order}_require_items" ON "{order}s";
                DROP FUNCTION "{order}_require_items"();
                """);
        }
    }
}
