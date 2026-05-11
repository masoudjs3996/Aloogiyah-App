
namespace AlooGiyah_Application.DTOs.BaseDto;

public class BaseFilterDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;

    public string? SortColumn { get; set; }
    public bool SortDescending { get; set; } = true;
}
