using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Comment
{
    public class CommentUpdateDto
    {
        [Required]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        [Range(1, 5)]
        public int? Rating { get; set; }
    }
}
