using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Comment
{
    public class CommentUpdateDto
    {
        [Required]
        [MaxLength(10)]
        public required string Code { get; set; } 

        [Required]
        [MaxLength(1000)]
        public required string Content { get; set; } 

        [Required]
        [MaxLength(10)]
        public required string StatusCode { get; set; }

        [Range(1, 5)]
        public int? Rating { get; set; }
    }
}
