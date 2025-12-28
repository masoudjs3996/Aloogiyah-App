using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace AlooGiyah_Domain.Entities.Store;

public class CartItem : BaseEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int CartItemId { get; set; }

    public Guid CartId { get; set; }

    public int AgriculturalProductId { get; set; }

    public int Quantity { get; set; }

    public decimal Price { get; set; } 

    public Cart Cart { get; set; } = null!;

    [ForeignKey(nameof(AgriculturalProductId))]
    public AgriculturalProduct AgriculturalProduct { get; set; } = null!;
}
