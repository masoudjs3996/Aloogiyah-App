namespace AlooGiyah_Domain.Entities.Store;

public class DeliveryPoint : BaseEntity
{
    public int DeliveryPointId { get; set; }
    public string Name { get; set; } = "";
    public string Address { get; set; } = "";
    public string Hours { get; set; } = "";
    public string CollectionTerms { get; set; } = "";
    public bool IsActive { get; set; } = true;
    // Null means a human must quote the last mile. Farm-to-market is always seller-paid.
    public decimal? DirectFee { get; set; }
    // A default local fee is only valid inside this county; other addresses need a quote.
    public int? CountyId { get; set; }
    public AlooGiyah_Domain.Entities.UserFolder.AddressFolder.County? County { get; set; }
}

public class DeliveryBooking : BaseEntity
{
    public int DeliveryBookingId { get; set; }
    public int BuyerId { get; set; }
    public Guid CartId { get; set; }
    public string CartHash { get; set; } = "";
    public string AddressCode { get; set; } = "";
    public string AddressSnapshot { get; set; } = "";
    public int DeliveryPointId { get; set; }
    public DeliveryPoint Point { get; set; } = null!;
    // Null for historical bookings; Point continues to retain their original meaning.
    public int? DestinationPointId { get; set; }
    public DeliveryPoint? DestinationPoint { get; set; }
    public List<DeliveryLeg> Legs { get; set; } = new();
    public string FarmPointsJson { get; set; } = "";
    public string PointSnapshot { get; set; } = "";
    public string Method { get; set; } = "Pickup";
    public string Window { get; set; } = "";
    public decimal? Fee { get; set; }
    // Separate from goods payments. Null limit preserves the historical fully quoted flow.
    public decimal? DeferredFeeLimit { get; set; }
    public decimal HeldDeliveryFee { get; set; }
    public decimal? DeferredFeePaid { get; set; }
    public DateTimeOffset QuoteExpiresAt { get; set; }
    public int? QuotedById { get; set; }
    public int? CheckoutId { get; set; }
    public Checkout? Checkout { get; set; }
    public string? RequestedMethod { get; set; }
    public string? ChangeReason { get; set; }
    public decimal? ChangeFee { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
    public List<DeliveryBatch> Batches { get; set; } = new();
    public List<DeliveryEvent> Events { get; set; } = new();
}

public class DeliveryBatch : BaseEntity
{
    public int DeliveryBatchId { get; set; }
    public int DeliveryBookingId { get; set; }
    public DeliveryBooking Booking { get; set; } = null!;
    public int AgentId { get; set; }
    public string Status { get; set; } = "Ready";
    public DateTimeOffset ExpectedAt { get; set; }
    public string? Note { get; set; }
    public string? CodeHash { get; set; }
    public DateTimeOffset? CodeExpiresAt { get; set; }
    public DateTimeOffset? CodeIssuedAt { get; set; }
    public int FailedAttempts { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public int? CompletedById { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
    public List<DeliveryBatchItem> Items { get; set; } = new();
}

public class DeliveryBatchItem : BaseEntity
{
    public int DeliveryBatchItemId { get; set; }
    public int DeliveryBatchId { get; set; }
    public DeliveryBatch Batch { get; set; } = null!;
    public int AgriculturalOrderItemId { get; set; }
    public AgriculturalOrderItem OrderItem { get; set; } = null!;
    public int Quantity { get; set; }
}

public class DeliveryEvent : BaseEntity
{
    public int DeliveryEventId { get; set; }
    public int DeliveryBookingId { get; set; }
    public int ActorId { get; set; }
    public string Action { get; set; } = "";
    public string Note { get; set; } = "";
}
