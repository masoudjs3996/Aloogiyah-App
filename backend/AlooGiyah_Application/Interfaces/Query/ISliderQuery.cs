using AlooGiyah_Application.DTOs.Slider;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface ISliderQuery
{
    Task<IEnumerable<SliderDto>> GetActiveSlidersAsync();
}
