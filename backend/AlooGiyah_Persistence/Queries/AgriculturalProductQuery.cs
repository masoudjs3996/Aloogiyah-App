using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Pagination;
using Dapper;

namespace AlooGiyah_Persistence.Queries;

public class AgriculturalProductQuery : BaseQuery, IAgriculturalProductQuery
{
    public AgriculturalProductQuery(IDbConnectionFactory factory)
        : base(factory)
    {
    }

    #region Get By Code

    public async Task<AgriculturalProductDetailDto?>
    GetByCodeAsync(string code, string role)
    {
        using var conn = CreateConnection();

        const string sql = """
        SELECT 
            p."AgriculturalProductId",
            p."Code",
            p."Name",
            p."Description",
            p."RetailPrice",
            p."WholesalePrice",
            p."Stock",
            p."Slug",
            p."DailyProductionCapacity",
            p."MetaTitle",
            p."MetaDescription",
            p."MetaKeywords",
            p."CreatedAt",

            f."Code"  AS "FarmCode",
            s."Code"  AS "StatusCode",

            c."Code"  AS "CategoryCode",

            img."Url"        AS "ImageUrl",
            img."IsPrimary"  AS "IsPrimary"

        FROM "AgriculturalProducts" p
        INNER JOIN "Farms" f 
            ON p."FarmId" = f."FarmId"
        INNER JOIN "Statuses" s 
            ON p."StatusId" = s."StatusId"

        LEFT JOIN "AgriculturalProductCategory" pc
            ON pc."AgriculturalProductsAgriculturalProductId" = p."AgriculturalProductId"
        LEFT JOIN "Categories" c
            ON c."CategoryId" = pc."CategoriesCategoryId"

        LEFT JOIN "Files" img
            ON img."EntityCode" = p."Code"
           AND img."EntityFile" = @EntityFile

        WHERE p."Code" = @Code
          AND p."IsDeleted" = false;
        """;

        var rows = await conn.QueryAsync(sql, new
        {
            Code = code,
            EntityFile = (int)EntityFile.AgriculturalProduct
        });

        var grouped = rows.GroupBy(r => (int)r.AgriculturalProductId)
                          .Select(g =>
                          {
                              var first = g.First();

                              var dto = new AgriculturalProductDetailDto
                              {
                                 
                                  Code = first.Code,
                                  Name = first.Name,
                                  Description = first.Description,
                                  RetailPrice = first.RetailPrice,
                                  WholesalePrice = first.WholesalePrice,
                                  Stock = first.Stock,
                                  Slug = first.Slug,
                                  DailyProductionCapacity = first.DailyProductionCapacity,
                                  MetaTitle = first.MetaTitle,
                                  MetaDescription = first.MetaDescription,
                                  MetaKeywords = first.MetaKeywords,
                                  CreatedAt = first.CreatedAt,
                                  FarmCode = first.FarmCode,
                                  StatusCode = first.StatusCode,

                                  CategoryCodes = g
                                      .Where(x => x.CategoryCode != null)
                                      .Select(x => (string)x.CategoryCode)
                                      .Distinct()
                                      .ToList(),

                                  ImageUrls = g
                                      .Where(x => x.ImageUrl != null)
                                      .Select(x => (string)x.ImageUrl)
                                      .Distinct()
                                      .ToList()
                              };

                              dto.PrimaryImageUrl =
                                  g.FirstOrDefault(x => x.IsPrimary == true)?.ImageUrl
                                  ?? dto.ImageUrls.FirstOrDefault()
                                  ?? "/images/default-product.jpg";

                              return dto;
                          })
                          .FirstOrDefault();

        if (grouped == null)
            return null;

        if (role is "User" or "Guest")
            grouped.WholesalePrice = null;

        return grouped;
    }
    #endregion

    #region Get By Filter
    public async Task<PagedResult<AgriculturalProductListItemDto>>
        GetByFilterAsync(AgriculturalProductFilterDto filter, string role)
    {
        using var conn = CreateConnection();

        var whereParts = new List<string>
    {
        "p.\"IsDeleted\" = false"
    };

        var parameters = new DynamicParameters();

        // Name
        if (!string.IsNullOrWhiteSpace(filter.Name))
        {
            whereParts.Add("p.\"Name\" ILIKE @Name");
            parameters.Add("Name", $"%{filter.Name}%");
        }

        // Farm
        if (!string.IsNullOrWhiteSpace(filter.FarmCode))
        {
            whereParts.Add("f.\"Code\" = @FarmCode");
            parameters.Add("FarmCode", filter.FarmCode);
        }

        // Status
        if (!string.IsNullOrWhiteSpace(filter.StatusCode))
        {
            whereParts.Add("s.\"Code\" = @StatusCode");
            parameters.Add("StatusCode", filter.StatusCode);
        }

        // Role based price
        string priceColumn = role == "User"
            ? "p.\"RetailPrice\""
            : "p.\"WholesalePrice\"";

        if (filter.MinPrice.HasValue)
        {
            whereParts.Add($"{priceColumn} >= @MinPrice");
            parameters.Add("MinPrice", filter.MinPrice);
        }

        if (filter.MaxPrice.HasValue)
        {
            whereParts.Add($"{priceColumn} <= @MaxPrice");
            parameters.Add("MaxPrice", filter.MaxPrice);
        }

        // Stock
        if (filter.MinStock.HasValue)
        {
            whereParts.Add("p.\"Stock\" >= @MinStock");
            parameters.Add("MinStock", filter.MinStock);
        }

        if (filter.MaxStock.HasValue)
        {
            whereParts.Add("p.\"Stock\" <= @MaxStock");
            parameters.Add("MaxStock", filter.MaxStock);
        }

        // Category filter
        if (filter.CategoryCodes?.Any() ?? false)
        {
            whereParts.Add("""
            EXISTS (
                SELECT 1
                FROM "AgriculturalProductCategory" pc
                INNER JOIN "Categories" c
                    ON c."CategoryId" = pc."CategoriesCategoryId"
                WHERE pc."AgriculturalProductsAgriculturalProductId" = p."AgriculturalProductId"
                  AND c."Code" = ANY(@CategoryCodes)
            )
        """);

            parameters.Add("CategoryCodes", filter.CategoryCodes.ToArray());
        }

        string whereClause = string.Join(" AND ", whereParts);

        // --------------------------
        // Main Query
        // --------------------------

        string dataSql = $"""
        SELECT 
            p."Code",
            p."Name",
            p."Description",
            p."Stock",
            p."Slug",
            p."CreatedAt",
            s."Code" AS "StatusCode",
            p."RetailPrice",
            CASE 
                WHEN @Role = 'User' THEN NULL
                ELSE p."WholesalePrice"
            END AS "WholesalePrice",
            COALESCE(img."Url", '/images/default-product.jpg') 
                AS "PrimaryImageUrl"
        FROM "AgriculturalProducts" p
        INNER JOIN "Farms" f 
            ON p."FarmId" = f."FarmId"
        INNER JOIN "Statuses" s 
            ON p."StatusId" = s."StatusId"
        LEFT JOIN "Files" img
            ON img."EntityCode" = p."Code"
           AND img."EntityFile" = @EntityFile
           AND img."IsPrimary" = true
        WHERE {whereClause}
        ORDER BY p."CreatedAt" DESC
    """;

        parameters.Add("Role", role);
        parameters.Add("EntityFile", (int)EntityFile.AgriculturalProduct);

        // --------------------------
        // Count Query
        // --------------------------

        string countSql = $"""
        SELECT COUNT(*)
        FROM "AgriculturalProducts" p
        INNER JOIN "Farms" f 
            ON p."FarmId" = f."FarmId"
        INNER JOIN "Statuses" s 
            ON p."StatusId" = s."StatusId"
        WHERE {whereClause}
    """;

        return await QueryPagedAsync<AgriculturalProductListItemDto>(
            dataSql,
            countSql,
            parameters,
            filter.PageNumber,
            filter.PageSize);
    }
    #endregion

    public async Task<PagedResult<AgriculturalProductSimilarDto>> GetSimilarAsync(
       AgriculturalProductSimilarFilterDto filter)
    {
        var parameters = new DynamicParameters();
        parameters.Add("CurrentProductCode", filter.ProductCode);
        parameters.Add("ProductEntity", (int)EntityFile.AgriculturalProduct);
        parameters.Add("ProductStatus", (int)EntityStatus.AgriculturalProduct);

        var baseSql = $"""
            WITH CurrentProduct AS (
                SELECT 
                    ap."AgriculturalProductId",
                    ap."FarmId"
                FROM "AgriculturalProducts" ap
                WHERE ap."Code" = @CurrentProductCode
                    AND ap."IsDeleted" = FALSE
                LIMIT 1
            ),
            CurrentCategories AS (
                SELECT apc."CategoriesCategoryId"
                FROM "AgriculturalProductCategory" apc
                INNER JOIN CurrentProduct cp 
                    ON apc."AgriculturalProductsAgriculturalProductId" = cp."AgriculturalProductId"
            )
            SELECT DISTINCT ON (ap."AgriculturalProductId")
                ap."Code" AS "Code",
                ap."Name" AS "Name",
                ap."Description" AS "Description",
                ap."RetailPrice" AS "RetailPrice",
                ap."WholesalePrice" AS "WholesalePrice",
                COALESCE(file."Url", '') AS "ProductImageUrl",
                CASE 
                    WHEN ap."FarmId" = cp."FarmId" 
                         AND EXISTS (
                             SELECT 1 
                             FROM "AgriculturalProductCategory" apc2
                             WHERE apc2."AgriculturalProductsAgriculturalProductId" = ap."AgriculturalProductId"
                                 AND apc2."CategoriesCategoryId" IN (SELECT "CategoriesCategoryId" FROM CurrentCategories)
                         )
                    THEN 3  -- هم مزرعه و هم دسته‌بندی
                    
                    WHEN ap."FarmId" = cp."FarmId" 
                    THEN 2  -- فقط همان مزرعه
                    
                    WHEN EXISTS (
                        SELECT 1 
                        FROM "AgriculturalProductCategory" apc3
                        WHERE apc3."AgriculturalProductsAgriculturalProductId" = ap."AgriculturalProductId"
                            AND apc3."CategoriesCategoryId" IN (SELECT "CategoriesCategoryId" FROM CurrentCategories)
                    )
                    THEN 1  -- فقط همان دسته‌بندی
                    
                    ELSE 0
                END AS "SimilarityScore"
                
            FROM "AgriculturalProducts" ap
            CROSS JOIN CurrentProduct cp
            
            LEFT JOIN "Files" file
                ON file."EntityCode" = ap."Code"
                AND file."EntityFile" = @ProductEntity
                AND file."IsPrimary" = TRUE
                AND file."IsDeleted" = FALSE
            
            WHERE ap."IsDeleted" = FALSE
                AND ap."Code" != @CurrentProductCode
                AND ap."StatusId" IN (
                    SELECT "StatusId" 
                    FROM "Statuses" 
                    WHERE "EntityStatus" = @ProductStatus 
                        AND "IsDeleted" = FALSE
                )
                AND (
                    ap."FarmId" = cp."FarmId"
                    OR EXISTS (
                        SELECT 1 
                        FROM "AgriculturalProductCategory" apc4
                        WHERE apc4."AgriculturalProductsAgriculturalProductId" = ap."AgriculturalProductId"
                            AND apc4."CategoriesCategoryId" IN (SELECT "CategoriesCategoryId" FROM CurrentCategories)
                    )
                )
            
            ORDER BY ap."AgriculturalProductId", "SimilarityScore" DESC
            """;

        var countSql = $"""
            SELECT COUNT(DISTINCT ap."AgriculturalProductId")
            FROM "AgriculturalProducts" ap
            CROSS JOIN (
                SELECT "FarmId", "AgriculturalProductId"
                FROM "AgriculturalProducts"
                WHERE "Code" = @CurrentProductCode
                    AND "IsDeleted" = FALSE
                LIMIT 1
            ) cp
            
            WHERE ap."IsDeleted" = FALSE
                AND ap."Code" != @CurrentProductCode
                AND (
                    ap."FarmId" = cp."FarmId"
                    OR EXISTS (
                        SELECT 1 
                        FROM "AgriculturalProductCategory" apc
                        WHERE apc."AgriculturalProductsAgriculturalProductId" = ap."AgriculturalProductId"
                            AND apc."CategoriesCategoryId" IN (
                                SELECT apc2."CategoriesCategoryId"
                                FROM "AgriculturalProductCategory" apc2
                                WHERE apc2."AgriculturalProductsAgriculturalProductId" = cp."AgriculturalProductId"
                            )
                    )
                )
            """;

        return await QueryPagedAsync<AgriculturalProductSimilarDto>(
            baseSql,
            countSql,
            parameters,
            filter.PageNumber,
            filter.PageSize);
    }
}