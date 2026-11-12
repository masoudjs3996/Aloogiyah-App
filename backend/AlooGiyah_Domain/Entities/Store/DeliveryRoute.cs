namespace AlooGiyah_Domain.Entities.Store;

// Supported route with a fixed fee or category tariffs and an optional fallback fee.
public class DeliveryRoute : BaseEntity
{
    public int DeliveryRouteId { get; set; }
    public int OriginPointId { get; set; }
    public DeliveryPoint OriginPoint { get; set; } = null!;
    public int DestinationPointId { get; set; }
    public DeliveryPoint DestinationPoint { get; set; } = null!;
    public bool IsBidirectional { get; set; }

    public bool SupportsDirection(int origin, int destination) =>
        (OriginPointId == origin && DestinationPointId == destination) ||
        (IsBidirectional && DestinationPointId == origin && OriginPointId == destination);

    public decimal? Fee { get; set; }
    public string PricingMode { get; set; } = "Flat";
    public List<DeliveryCategoryTariff> CategoryTariffs { get; set; } = [];
    public int? MaxQuantity { get; set; }
    public int TransitDays { get; set; } = 1;
    public bool IsActive { get; set; } = true;
}

// One inter-hub leg per origin, plus at most one final local leg for a whole purchase.
public class DeliveryLeg : BaseEntity
{
    public string PricingDetailsJson { get; set; } = "[]";
    public int DeliveryLegId { get; set; }
    public int DeliveryBookingId { get; set; }
    public DeliveryBooking Booking { get; set; } = null!;
    public int OriginPointId { get; set; }
    public DeliveryPoint OriginPoint { get; set; } = null!;
    public int? DestinationPointId { get; set; }
    public DeliveryPoint? DestinationPoint { get; set; }
    public string Kind { get; set; } = "InterHub";
    public string RouteSnapshot { get; set; } = "";
    public decimal? Fee { get; set; }
    public int TransitDays { get; set; }
    public bool IsManualPrice { get; set; }
    public bool IsDeferred { get; set; }
    public string Status { get; set; } = "Waiting";
}
