using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities.Store;

public class OrderItem : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int OrderItemId { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    public decimal Price { get; set; }

    [Required]
    public string PriceType { get; set; } = string.Empty;

    [Required]
    public int OrderId { get; set; }

    [Required]
    public int ProductId { get; set; }
    #endregion

    #region Relations
    [ForeignKey(nameof(OrderId))]
    public Order Order { get; set; } = null!;

    [ForeignKey(nameof(ProductId))]
    public Product Product { get; set; } = null!;
    #endregion
}