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
<<<<<<< HEAD
                    ON c."CategoryId" = pc."CategoriesCategoryId"
                WHERE pc."AgriculturalProductsAgriculturalProductId" = p."AgriculturalProductId"
=======
                    ON c."CategoryId" = pc."CategoryId"
                WHERE pc."AgriculturalProductId" = p."AgriculturalProductId"
>>>>>>> f9b620d26db82ed1ded71f658dae6fc2ebb8f57c
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
}