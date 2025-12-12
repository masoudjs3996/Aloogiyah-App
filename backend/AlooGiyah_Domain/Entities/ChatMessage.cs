using AlooGiyah_Domain.Entities.UserFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class ChatMessage : BaseEntity
{

    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ChatMessageId { get; set; }

    [MaxLength(4000)]
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; } = false;
    #endregion


    #region Relations
    public int SenderId { get; set; }
    [ForeignKey(nameof(SenderId))]
    public User Sender { get; set; } = null!;

    public int ReceiverId { get; set; }
    [ForeignKey(nameof(ReceiverId))]
    public User Receiver { get; set; } = null!;
    #endregion

}
