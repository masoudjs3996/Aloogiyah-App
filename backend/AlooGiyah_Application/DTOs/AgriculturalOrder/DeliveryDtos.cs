using System.ComponentModel.DataAnnotations;
namespace AlooGiyah_Application.DTOs.AgriculturalOrder;

public record DeliveryPointInput(
    [Required, StringLength(150)] string Name,
    [Required, StringLength(1000)] string Address,
    [Required, StringLength(200)] string Hours,
    [Required, StringLength(1000)] string CollectionTerms, bool IsActive, decimal? DirectFee, int? CountyId = null);
public record DeliveryRouteInput([Required] string OriginCode, [Required] string DestinationCode,
    decimal? Fee, [Range(1, 30)] int TransitDays = 1, bool IsActive = true, [Range(1, int.MaxValue)] int? MaxQuantity = null,
    [RegularExpression("^(Flat|CategoryUnits)$")] string? PricingMode = null, bool? IsBidirectional = null);
public record DeliveryCategoryTariffInput([Required] string CategoryCode, [Required, RegularExpression("^(Kilogram|Package|Piece)$")] string SaleUnit, [Range(1, int.MaxValue)] int BlockSize, decimal PricePerBlock);
public record DeliveryTariffIncreaseInput(decimal Percent, string? ExpectedToken = null);
public record DeliveryTariffLineDto(string Key, string? CategoryCode, string Name, long Quantity, string? SaleUnit,
    int? BlockSize, long? BlockCount, decimal? PricePerBlock, decimal? Fee);
public record DeliveryLegPriceInput(decimal Fee);
public record DeliveryQuoteInput(Guid CartId, [Required] string AddressCode,
    string? PointCode, [Required] string Method, [Required, StringLength(200)] string Window);
public record DeliveryPriceInput(decimal Fee);
public record DeliveryRetryPriceInput(decimal Fee, [Required, StringLength(1000)] string Note);
public record LegacyDeliveryInput([Required] string CheckoutCode, [Required] string PointCode, [Required, StringLength(200)] string Window);
public record HubReceiptInput([Required] string ItemCode, [Range(1, int.MaxValue)] int Quantity, string Stage = "Destination");
public record DeliveryLineInput([Required] string ItemCode, [Range(1, int.MaxValue)] int Quantity);
public record DeliveryBatchInput(int AgentId, DateTimeOffset ExpectedAt, [Required] List<DeliveryLineInput> Items);
public record DeliveryVerifyInput([Required, RegularExpression("^[0-9]{6}$")] string Code);
public record DeliveryNoteInput([Required, StringLength(1000, MinimumLength = 3)] string Note);
public record DeliveryChangeInput([Required] string Method, [Required, StringLength(1000)] string Reason);
public record DeliveryCodeDto(string Code, DateTimeOffset ExpiresAt);
public record DeliveryLineDto(string ItemCode, string OrderCode, string FarmName, string Name,
    int Quantity, int ReceivedAtHubQuantity, int DeliveredQuantity, int AllocatedQuantity)
{
    public int ReceivedAtOriginQuantity { get; init; }
    public string? SaleUnit { get; init; }
    public string OriginPoint { get; init; } = "";
    public string OriginCode { get; init; } = "";
    public bool IsPaid { get; init; }
    public string OrderStatus { get; init; } = "";
    public bool InterHub { get; init; }
}
public record DeliveryLegDto(string Code, string Kind, string Route, decimal? Fee, int TransitDays, string Status)
{
    public List<DeliveryTariffLineDto> PricingDetails { get; init; } = [];
    public bool IsDeferred { get; init; }
    public string OriginCode { get; init; } = "";
}
public record DeliveryBatchLineDto(string ItemCode, string OrderCode, string FarmName, string Name, int Quantity)
{
    public string? SaleUnit { get; init; }
}
public record DeliveryBatchDto(string Code, int AgentId, string Status, DateTimeOffset ExpectedAt,
    string? Note, DateTimeOffset? CompletedAt, List<DeliveryBatchLineDto> Items);
public record DeliveryEventDto(int ActorId, string Action, string Note, DateTimeOffset CreatedAt);
public record DeliveryBookingDto(string Code, string? CheckoutCode, string Method, string Window,
    string Point, string Address, decimal? Fee, DateTimeOffset QuoteExpiresAt,
    string? RequestedMethod, decimal? ChangeFee, string? ChangeReason,
    List<DeliveryLineDto> Items, List<DeliveryBatchDto> Batches, List<DeliveryEventDto> Events)
{
    public List<FarmDeliveryGroup> Groups { get; init; } = new();
    public string? DestinationCode { get; init; }
    public List<DeliveryLegDto> Legs { get; init; } = new();
    public decimal KnownFee { get; init; }
    public bool HasUnpricedLegs { get; init; }
    public decimal? DeferredFeeLimit { get; init; }
    public decimal HeldDeliveryFee { get; init; }
    public decimal? DeferredFeePaid { get; init; }
    public decimal? ProposedDeferredFee { get; init; }
}

public record FarmDeliveryPointInput([Required] string PointCode);
public record FarmDeliveryGroup(string PointCode, string Name, string Address, string Hours,
    decimal? Fee, List<int> FarmIds, List<string> FarmNames);
