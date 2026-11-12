using AlooGiyah_Application.DTOs.Slider;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Persistence.Queries;
public class SliderQuery : BaseQuery, ISliderQuery
{
    public SliderQuery(IDbConnectionFactory factory) : base(factory) { }

    public async Task<IEnumerable<SliderDto>> GetActiveSlidersAsync() => await QueryJsonAsync<SliderDto>("""
SELECT (to_jsonb(t) || jsonb_build_object('ImageUrl', (SELECT fi."Url" FROM "Files" fi WHERE fi."EntityCode"=t."Code" AND fi."EntityFile"=8 AND fi."IsPrimary" AND NOT fi."IsDeleted" ORDER BY fi."CreatedAt" DESC, fi."FileId" DESC LIMIT 1)))::text FROM "Sliders" t WHERE NOT t."IsDeleted" AND t."IsActive" ORDER BY t."Order", t."SliderId"
""");
}
