using Microsoft.AspNetCore.Http;

namespace AlooGiyah_Application.DTOs.Slider;

public class CreateSliderDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? LinkUrl { get; set; }
    public int Order { get; set; }

    public IFormFile Image { get; set; } = null!;
}
