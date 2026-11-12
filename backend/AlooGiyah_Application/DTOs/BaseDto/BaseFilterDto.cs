using System.ComponentModel.DataAnnotations;
﻿
namespace AlooGiyah_Application.DTOs.BaseDto;

public class BaseFilterDto
{
    [Range(1, int.MaxValue)]
    public int PageNumber { get; set; } = 1;
    [Range(1, 100)]
    public int PageSize { get; set; } = 20;

    public string? SortColumn { get; set; }
    public bool SortDescending { get; set; } = true;
}
