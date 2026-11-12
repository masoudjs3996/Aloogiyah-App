using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RelationalIntegrityCleanup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Refuse to discard or guess legacy data. Every check includes soft-deleted rows.
            migrationBuilder.Sql("""
                DO $guard$
                DECLARE link record; invalid boolean;
                BEGIN
                    IF EXISTS (SELECT 1 FROM "AgriculturalProducts" WHERE "UserId" IS NOT NULL) THEN
                        RAISE EXCEPTION 'RelationalIntegrityCleanup: AgriculturalProducts.UserId contains legacy associations; review before removing the unused relationship.';
                    END IF;
                    FOR link IN SELECT * FROM (VALUES
                        ('BusinessApplications', 'ReviewedById'),
                        ('AgriculturalOrders', 'DeliveredById'),
                        ('AgriculturalOrderHistories', 'ActorId'),
                        ('OrderRefunds', 'CompletedById'),
                        ('DeliveryBookings', 'QuotedById'),
                        ('DeliveryBatches', 'CompletedById'),
                        ('DeliveryEvents', 'ActorId'),
                        ('SettlementCalendarDays', 'ConfirmedById'),
                        ('SettlementHistories', 'ActorId'),
                        ('SettlementRates', 'ChangedById'),
                        ('SettlementTransferAttempts', 'StartedById'),
                        ('SettlementTransferAttempts', 'CompletedById')
                    ) AS links(table_name, column_name)
                    LOOP
                        EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I t WHERE t.%I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Users" u WHERE u."UserId" = t.%I))',
                            link.table_name, link.column_name, link.column_name) INTO invalid;
                        IF invalid THEN
                            RAISE EXCEPTION 'RelationalIntegrityCleanup: orphan user reference in %.%; repair before retrying.', link.table_name, link.column_name;
                        END IF;
                    END LOOP;
                    IF EXISTS (SELECT 1 FROM "Farms" f WHERE f."DeliveryPointCode" IS NOT NULL AND NOT EXISTS
                        (SELECT 1 FROM "DeliveryPoints" p WHERE p."Code" = f."DeliveryPointCode")) THEN
                        RAISE EXCEPTION 'RelationalIntegrityCleanup: orphan Farms.DeliveryPointCode; select a valid point before retrying.';
                    END IF;
                    IF EXISTS (SELECT 1 FROM "WarehouseInventories" w WHERE
                        (w."EntityWarehouse" = 0 AND NOT EXISTS (SELECT 1 FROM "AgriculturalProducts" p WHERE p."AgriculturalProductId" = w."EntityId")) OR
                        (w."EntityWarehouse" = 1 AND NOT EXISTS (SELECT 1 FROM "Products" p WHERE p."ProductId" = w."EntityId")) OR
                        w."EntityWarehouse" NOT IN (0, 1) OR
                        (w."AgriculturalProductId" IS NOT NULL AND (w."EntityWarehouse" <> 0 OR w."AgriculturalProductId" <> w."EntityId")) OR
                        (w."ProductId" IS NOT NULL AND (w."EntityWarehouse" <> 1 OR w."ProductId" <> w."EntityId"))) THEN
                        RAISE EXCEPTION 'RelationalIntegrityCleanup: invalid or conflicting warehouse target; review inventory before retrying.';
                    END IF;
                    IF EXISTS (SELECT 1 FROM "WarehouseInventories" WHERE NOT "IsDeleted"
                        GROUP BY "WarehouseId", "EntityWarehouse", "EntityId" HAVING count(*) > 1) THEN
                        RAISE EXCEPTION 'RelationalIntegrityCleanup: duplicate active warehouse inventory; reconcile quantities before retrying.';
                    END IF;
                END $guard$;
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_AgriculturalProducts_Users_UserId",
                table: "AgriculturalProducts");

            migrationBuilder.DropForeignKey(
                name: "FK_Carts_Farms_FarmId",
                table: "Carts");

            migrationBuilder.DropForeignKey(
                name: "FK_Categories_Discounts_DiscountId",
                table: "Categories");

            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Comments_ParentCommentId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_Discounts_Farms_FarmId",
                table: "Discounts");

            migrationBuilder.DropForeignKey(
                name: "FK_WarehouseInventories_AgriculturalProducts_AgriculturalProdu~",
                table: "WarehouseInventories");

            migrationBuilder.DropForeignKey(
                name: "FK_WarehouseInventories_Products_ProductId",
                table: "WarehouseInventories");

            migrationBuilder.DropIndex(
                name: "IX_WarehouseInventories_WarehouseId",
                table: "WarehouseInventories");

            migrationBuilder.DropIndex(
                name: "IX_SettlementHistories_SettlementRequestId",
                table: "SettlementHistories");

            migrationBuilder.DropIndex(
                name: "IX_Files_EntityFile",
                table: "Files");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryEvents_DeliveryBookingId",
                table: "DeliveryEvents");

            migrationBuilder.DropIndex(
                name: "IX_Categories_DiscountId",
                table: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_Carts_CartId",
                table: "Carts");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalProducts_UserId",
                table: "AgriculturalProducts");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalOrders_BuyerId",
                table: "AgriculturalOrders");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalOrders_FarmId",
                table: "AgriculturalOrders");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalOrderHistories_AgriculturalOrderId",
                table: "AgriculturalOrderHistories");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "AgriculturalProducts");

            migrationBuilder.AddUniqueConstraint(
                name: "AK_DeliveryPoints_Code",
                table: "DeliveryPoints",
                column: "Code");

            migrationBuilder.CreateTable(
                name: "DiscountCategories",
                columns: table => new
                {
                    CategoriesCategoryId = table.Column<int>(type: "integer", nullable: false),
                    DiscountsDiscountId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscountCategories", x => new { x.CategoriesCategoryId, x.DiscountsDiscountId });
                    table.ForeignKey(
                        name: "FK_DiscountCategories_Categories_CategoriesCategoryId",
                        column: x => x.CategoriesCategoryId,
                        principalTable: "Categories",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DiscountCategories_Discounts_DiscountsDiscountId",
                        column: x => x.DiscountsDiscountId,
                        principalTable: "Discounts",
                        principalColumn: "DiscountId",
                        onDelete: ReferentialAction.Cascade);
                });

            // Copy associations before removing the old one-discount-per-category column.
            migrationBuilder.Sql("""
                INSERT INTO "DiscountCategories" ("CategoriesCategoryId", "DiscountsDiscountId")
                SELECT "CategoryId", "DiscountId" FROM "Categories" WHERE "DiscountId" IS NOT NULL;
                UPDATE "WarehouseInventories" SET
                    "AgriculturalProductId" = CASE WHEN "EntityWarehouse" = 0 THEN "EntityId" END,
                    "ProductId" = CASE WHEN "EntityWarehouse" = 1 THEN "EntityId" END;
                """);
            migrationBuilder.DropColumn(
                name: "DiscountId",
                table: "Categories");

            migrationBuilder.DropIndex(name: "IX_DeliveryPoints_Code", table: "DeliveryPoints");

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseInventories_WarehouseId_EntityWarehouse_EntityId",
                table: "WarehouseInventories",
                columns: new[] { "WarehouseId", "EntityWarehouse", "EntityId" },
                unique: true,
                filter: "NOT \"IsDeleted\"");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WarehouseInventory_Quantity",
                table: "WarehouseInventories",
                sql: "\"Quantity\" >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WarehouseInventory_Target",
                table: "WarehouseInventories",
                sql: "(\"EntityWarehouse\" = 0 AND \"AgriculturalProductId\" IS NOT NULL AND \"AgriculturalProductId\" = \"EntityId\" AND \"ProductId\" IS NULL) OR (\"EntityWarehouse\" = 1 AND \"ProductId\" IS NOT NULL AND \"ProductId\" = \"EntityId\" AND \"AgriculturalProductId\" IS NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_SettlementTransferAttempts_CompletedById",
                table: "SettlementTransferAttempts",
                column: "CompletedById");

            migrationBuilder.CreateIndex(
                name: "IX_SettlementTransferAttempts_StartedById",
                table: "SettlementTransferAttempts",
                column: "StartedById");

            migrationBuilder.CreateIndex(
                name: "IX_SettlementRequests_Status_ScheduledDate",
                table: "SettlementRequests",
                columns: new[] { "Status", "ScheduledDate" });

            migrationBuilder.CreateIndex(
                name: "IX_SettlementRates_ChangedById",
                table: "SettlementRates",
                column: "ChangedById");

            migrationBuilder.CreateIndex(
                name: "IX_SettlementHistories_ActorId",
                table: "SettlementHistories",
                column: "ActorId");

            migrationBuilder.CreateIndex(
                name: "IX_SettlementHistories_SettlementRequestId_CreatedAt",
                table: "SettlementHistories",
                columns: new[] { "SettlementRequestId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SettlementCalendarDays_ConfirmedById",
                table: "SettlementCalendarDays",
                column: "ConfirmedById");

            migrationBuilder.CreateIndex(
                name: "IX_OrderRefunds_CompletedById",
                table: "OrderRefunds",
                column: "CompletedById");

            migrationBuilder.CreateIndex(
                name: "IX_Files_EntityFile_EntityCode",
                table: "Files",
                columns: new[] { "EntityFile", "EntityCode" });

            migrationBuilder.CreateIndex(
                name: "IX_Farms_DeliveryPointCode",
                table: "Farms",
                column: "DeliveryPointCode");

            migrationBuilder.AddCheckConstraint(
                name: "CK_DeliveryPoints_DirectFee",
                table: "DeliveryPoints",
                sql: "\"DirectFee\" IS NULL OR \"DirectFee\" >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryEvents_ActorId",
                table: "DeliveryEvents",
                column: "ActorId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryEvents_DeliveryBookingId_CreatedAt",
                table: "DeliveryEvents",
                columns: new[] { "DeliveryBookingId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBookings_QuotedById",
                table: "DeliveryBookings",
                column: "QuotedById");

            migrationBuilder.AddCheckConstraint(
                name: "CK_DeliveryBatchItems_Quantity",
                table: "DeliveryBatchItems",
                sql: "\"Quantity\" > 0");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBatches_CompletedById",
                table: "DeliveryBatches",
                column: "CompletedById");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Comments_Rating",
                table: "Comments",
                sql: "\"Rating\" IS NULL OR \"Rating\" BETWEEN 1 AND 5");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessApplications_ReviewedById",
                table: "BusinessApplications",
                column: "ReviewedById");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalOrders_BuyerId_CreatedAt",
                table: "AgriculturalOrders",
                columns: new[] { "BuyerId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalOrders_DeliveredById",
                table: "AgriculturalOrders",
                column: "DeliveredById");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalOrders_FarmId_CreatedAt",
                table: "AgriculturalOrders",
                columns: new[] { "FarmId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalOrderHistories_ActorId",
                table: "AgriculturalOrderHistories",
                column: "ActorId");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalOrderHistories_AgriculturalOrderId_CreatedAt",
                table: "AgriculturalOrderHistories",
                columns: new[] { "AgriculturalOrderId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DiscountCategories_DiscountsDiscountId",
                table: "DiscountCategories",
                column: "DiscountsDiscountId");

            migrationBuilder.AddForeignKey(
                name: "FK_AgriculturalOrderHistories_Users_ActorId",
                table: "AgriculturalOrderHistories",
                column: "ActorId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AgriculturalOrders_Users_DeliveredById",
                table: "AgriculturalOrders",
                column: "DeliveredById",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_BusinessApplications_Users_ReviewedById",
                table: "BusinessApplications",
                column: "ReviewedById",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Carts_Farms_FarmId",
                table: "Carts",
                column: "FarmId",
                principalTable: "Farms",
                principalColumn: "FarmId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Comments_ParentCommentId",
                table: "Comments",
                column: "ParentCommentId",
                principalTable: "Comments",
                principalColumn: "CommentId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryBatches_Users_CompletedById",
                table: "DeliveryBatches",
                column: "CompletedById",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryBookings_Users_QuotedById",
                table: "DeliveryBookings",
                column: "QuotedById",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryEvents_Users_ActorId",
                table: "DeliveryEvents",
                column: "ActorId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Discounts_Farms_FarmId",
                table: "Discounts",
                column: "FarmId",
                principalTable: "Farms",
                principalColumn: "FarmId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Farms_DeliveryPoints_DeliveryPointCode",
                table: "Farms",
                column: "DeliveryPointCode",
                principalTable: "DeliveryPoints",
                principalColumn: "Code",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderRefunds_Users_CompletedById",
                table: "OrderRefunds",
                column: "CompletedById",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SettlementCalendarDays_Users_ConfirmedById",
                table: "SettlementCalendarDays",
                column: "ConfirmedById",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SettlementHistories_Users_ActorId",
                table: "SettlementHistories",
                column: "ActorId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SettlementRates_Users_ChangedById",
                table: "SettlementRates",
                column: "ChangedById",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SettlementTransferAttempts_Users_CompletedById",
                table: "SettlementTransferAttempts",
                column: "CompletedById",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SettlementTransferAttempts_Users_StartedById",
                table: "SettlementTransferAttempts",
                column: "StartedById",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WarehouseInventories_AgriculturalProducts_AgriculturalProdu~",
                table: "WarehouseInventories",
                column: "AgriculturalProductId",
                principalTable: "AgriculturalProducts",
                principalColumn: "AgriculturalProductId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WarehouseInventories_Products_ProductId",
                table: "WarehouseInventories",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "ProductId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // The previous schema cannot represent multiple discounts for one category.
            migrationBuilder.Sql("""
                DO $guard$
                BEGIN
                    IF EXISTS (SELECT 1 FROM "DiscountCategories" GROUP BY "CategoriesCategoryId" HAVING count(*) > 1) THEN
                        RAISE EXCEPTION 'RelationalIntegrityCleanup rollback: multiple discounts per category cannot be represented by the old schema; reconcile before retrying.';
                    END IF;
                END $guard$;
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_AgriculturalOrderHistories_Users_ActorId",
                table: "AgriculturalOrderHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_AgriculturalOrders_Users_DeliveredById",
                table: "AgriculturalOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_BusinessApplications_Users_ReviewedById",
                table: "BusinessApplications");

            migrationBuilder.DropForeignKey(
                name: "FK_Carts_Farms_FarmId",
                table: "Carts");

            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Comments_ParentCommentId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryBatches_Users_CompletedById",
                table: "DeliveryBatches");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryBookings_Users_QuotedById",
                table: "DeliveryBookings");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryEvents_Users_ActorId",
                table: "DeliveryEvents");

            migrationBuilder.DropForeignKey(
                name: "FK_Discounts_Farms_FarmId",
                table: "Discounts");

            migrationBuilder.DropForeignKey(
                name: "FK_Farms_DeliveryPoints_DeliveryPointCode",
                table: "Farms");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderRefunds_Users_CompletedById",
                table: "OrderRefunds");

            migrationBuilder.DropForeignKey(
                name: "FK_SettlementCalendarDays_Users_ConfirmedById",
                table: "SettlementCalendarDays");

            migrationBuilder.DropForeignKey(
                name: "FK_SettlementHistories_Users_ActorId",
                table: "SettlementHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_SettlementRates_Users_ChangedById",
                table: "SettlementRates");

            migrationBuilder.DropForeignKey(
                name: "FK_SettlementTransferAttempts_Users_CompletedById",
                table: "SettlementTransferAttempts");

            migrationBuilder.DropForeignKey(
                name: "FK_SettlementTransferAttempts_Users_StartedById",
                table: "SettlementTransferAttempts");

            migrationBuilder.DropForeignKey(
                name: "FK_WarehouseInventories_AgriculturalProducts_AgriculturalProdu~",
                table: "WarehouseInventories");

            migrationBuilder.DropForeignKey(
                name: "FK_WarehouseInventories_Products_ProductId",
                table: "WarehouseInventories");

            migrationBuilder.DropIndex(
                name: "IX_WarehouseInventories_WarehouseId_EntityWarehouse_EntityId",
                table: "WarehouseInventories");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WarehouseInventory_Quantity",
                table: "WarehouseInventories");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WarehouseInventory_Target",
                table: "WarehouseInventories");

            migrationBuilder.DropIndex(
                name: "IX_SettlementTransferAttempts_CompletedById",
                table: "SettlementTransferAttempts");

            migrationBuilder.DropIndex(
                name: "IX_SettlementTransferAttempts_StartedById",
                table: "SettlementTransferAttempts");

            migrationBuilder.DropIndex(
                name: "IX_SettlementRequests_Status_ScheduledDate",
                table: "SettlementRequests");

            migrationBuilder.DropIndex(
                name: "IX_SettlementRates_ChangedById",
                table: "SettlementRates");

            migrationBuilder.DropIndex(
                name: "IX_SettlementHistories_ActorId",
                table: "SettlementHistories");

            migrationBuilder.DropIndex(
                name: "IX_SettlementHistories_SettlementRequestId_CreatedAt",
                table: "SettlementHistories");

            migrationBuilder.DropIndex(
                name: "IX_SettlementCalendarDays_ConfirmedById",
                table: "SettlementCalendarDays");

            migrationBuilder.DropIndex(
                name: "IX_OrderRefunds_CompletedById",
                table: "OrderRefunds");

            migrationBuilder.DropIndex(
                name: "IX_Files_EntityFile_EntityCode",
                table: "Files");

            migrationBuilder.DropIndex(
                name: "IX_Farms_DeliveryPointCode",
                table: "Farms");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_DeliveryPoints_Code",
                table: "DeliveryPoints");

            migrationBuilder.DropCheckConstraint(
                name: "CK_DeliveryPoints_DirectFee",
                table: "DeliveryPoints");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryEvents_ActorId",
                table: "DeliveryEvents");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryEvents_DeliveryBookingId_CreatedAt",
                table: "DeliveryEvents");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryBookings_QuotedById",
                table: "DeliveryBookings");

            migrationBuilder.DropCheckConstraint(
                name: "CK_DeliveryBatchItems_Quantity",
                table: "DeliveryBatchItems");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryBatches_CompletedById",
                table: "DeliveryBatches");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Comments_Rating",
                table: "Comments");

            migrationBuilder.DropIndex(
                name: "IX_BusinessApplications_ReviewedById",
                table: "BusinessApplications");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalOrders_BuyerId_CreatedAt",
                table: "AgriculturalOrders");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalOrders_DeliveredById",
                table: "AgriculturalOrders");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalOrders_FarmId_CreatedAt",
                table: "AgriculturalOrders");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalOrderHistories_ActorId",
                table: "AgriculturalOrderHistories");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalOrderHistories_AgriculturalOrderId_CreatedAt",
                table: "AgriculturalOrderHistories");

            migrationBuilder.AddColumn<int>(
                name: "DiscountId",
                table: "Categories",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "AgriculturalProducts",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "Categories" c SET "DiscountId" = dc."DiscountsDiscountId"
                FROM "DiscountCategories" dc WHERE c."CategoryId" = dc."CategoriesCategoryId";
                """);
            migrationBuilder.DropTable(
                name: "DiscountCategories");


            migrationBuilder.CreateIndex(name: "IX_DeliveryPoints_Code", table: "DeliveryPoints", column: "Code", unique: true);


            migrationBuilder.CreateIndex(
                name: "IX_WarehouseInventories_WarehouseId",
                table: "WarehouseInventories",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_SettlementHistories_SettlementRequestId",
                table: "SettlementHistories",
                column: "SettlementRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Files_EntityFile",
                table: "Files",
                column: "EntityFile");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryEvents_DeliveryBookingId",
                table: "DeliveryEvents",
                column: "DeliveryBookingId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_DiscountId",
                table: "Categories",
                column: "DiscountId");

            migrationBuilder.CreateIndex(
                name: "IX_Carts_CartId",
                table: "Carts",
                column: "CartId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalProducts_UserId",
                table: "AgriculturalProducts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalOrders_BuyerId",
                table: "AgriculturalOrders",
                column: "BuyerId");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalOrders_FarmId",
                table: "AgriculturalOrders",
                column: "FarmId");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalOrderHistories_AgriculturalOrderId",
                table: "AgriculturalOrderHistories",
                column: "AgriculturalOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_AgriculturalProducts_Users_UserId",
                table: "AgriculturalProducts",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Carts_Farms_FarmId",
                table: "Carts",
                column: "FarmId",
                principalTable: "Farms",
                principalColumn: "FarmId");

            migrationBuilder.AddForeignKey(
                name: "FK_Categories_Discounts_DiscountId",
                table: "Categories",
                column: "DiscountId",
                principalTable: "Discounts",
                principalColumn: "DiscountId");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Comments_ParentCommentId",
                table: "Comments",
                column: "ParentCommentId",
                principalTable: "Comments",
                principalColumn: "CommentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Discounts_Farms_FarmId",
                table: "Discounts",
                column: "FarmId",
                principalTable: "Farms",
                principalColumn: "FarmId");

            migrationBuilder.AddForeignKey(
                name: "FK_WarehouseInventories_AgriculturalProducts_AgriculturalProdu~",
                table: "WarehouseInventories",
                column: "AgriculturalProductId",
                principalTable: "AgriculturalProducts",
                principalColumn: "AgriculturalProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_WarehouseInventories_Products_ProductId",
                table: "WarehouseInventories",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "ProductId");
        }
    }
}
