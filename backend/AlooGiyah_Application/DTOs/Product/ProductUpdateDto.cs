using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Product;

public class ProductUpdateDto : ProductCreateDto
{
    public string ProductCode { get; set; } = string.Empty;
}
