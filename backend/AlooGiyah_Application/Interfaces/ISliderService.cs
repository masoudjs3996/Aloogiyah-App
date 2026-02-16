
using AlooGiyah_Application.DTOs.Slider;

namespace AlooGiyah_Application.Interfaces;

public interface ISliderService
{
    Task<SliderDto> CreateSliderAsync(CreateSliderDto dto);
    Task<IEnumerable<SliderDto>> GetActiveSlidersAsync();
    Task DeleteSliderAsync(string sliderCode);
}
