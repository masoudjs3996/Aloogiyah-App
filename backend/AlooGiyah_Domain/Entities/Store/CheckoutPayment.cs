namespace AlooGiyah_Domain.Entities.Store;
public class CheckoutPayment : BaseEntity
{
    public int CheckoutPaymentId { get; set; }
    public int CheckoutId { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = "Wallet";
    public string Reference { get; set; } = string.Empty;
    public DateTimeOffset ConfirmedAt { get; set; }
    public Checkout Checkout { get; set; } = null!;
}
