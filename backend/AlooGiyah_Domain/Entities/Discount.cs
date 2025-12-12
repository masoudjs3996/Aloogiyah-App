
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Domain.Entities;

public class Discount : BaseEntity
{
    #region Properties
    public int DiscountId { get; set; }
    public DiscountType DiscountType { get; set; }
    public decimal Value { get; set; }
    public DateTimeOffset? StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }
    public int? MaxUsage { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public int UsageCount { get; set; }
    public bool IsActive { get; set; }
    #endregion

    #region Relations
    // اگر برای یک مزرعه خاص باشد
    public int? FarmId { get; set; }
    public Farm? Farm { get; set; }

    public List<Order> Orders { get; set; } = null!;
    public List<AgriculturalOrder> AgriculturalOrders { get; set; } = null!;
    public List<AgriculturalProduct> agriculturalProducts { get; set; } = null!;
    public List<ServiceRequest> ServiceRequests { get; set; } = null!;
    public List<User> Users { get; set; } = null!;// کاربران مجاز برای تخفیف
    public List<Product> Products { get; set; } = null!;// محصولات مجاز برای تخفیف
    public List<Category> Categories { get; set; } = null!;
    #endregion
}