
namespace AlooGiyah_Application.DTOs.Farm;

public class MyFarmlistDto
{
    public required string Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? Capacity { get; set; }

    // آدرس
    public string ProvinceName { get; set; } = string.Empty;
    public string CountyName { get; set; } = string.Empty;

    // عکس مزرعه
    public string FarmImageUrl { get; set; } = string.Empty;

    // استاتوس
    public string StatusCode { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;

    // اولین محصول
    public string FirstProductName { get; set; } = string.Empty;
}
