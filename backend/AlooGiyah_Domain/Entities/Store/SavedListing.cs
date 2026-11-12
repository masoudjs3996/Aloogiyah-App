using AlooGiyah_Domain.Entities.UserFolder;

namespace AlooGiyah_Domain.Entities.Store;

public sealed class SavedListing
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int ListingId { get; set; }
    public AgriculturalListing Listing { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
}
