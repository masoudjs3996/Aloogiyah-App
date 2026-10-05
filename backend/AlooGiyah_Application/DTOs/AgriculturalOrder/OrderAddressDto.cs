namespace AlooGiyah_Application.DTOs.AgriculturalOrder;
public class OrderAddressDto
{
    public string Recipient { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string County { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? Village { get; set; }
    public string Street { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}
