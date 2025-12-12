using AlooGiyah_Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Comment;

public class CommentCreateDto
{
    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;

    [Range(1, 5)]
    public int? Rating { get; set; }

    [Required]
    public string EntityCode { get; set; } = string.Empty;

    public string? ParentCode { get; set; }

    [Required]
    public EntityComment EntityComment { get; set; } // مثلاً "Order" یا "ServiceRequest"
}
