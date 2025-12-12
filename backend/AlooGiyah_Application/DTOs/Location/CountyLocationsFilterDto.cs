using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Location;

public class CountyLocationsFilterDto 
{
    [Required]
    public required string countyCode {  get; set; } 
    public bool? IncludeVillages { get; set; } = null;

}
