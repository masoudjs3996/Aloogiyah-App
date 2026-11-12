namespace AlooGiyah_Shared.Constants;

/// <summary>Titles stored in Notifications.Type and displayed by web and mobile clients.</summary>
public static class NotificationTypes
{
    public const string OrderSubmitted = "سفارش ثبت شد";
    public const string FarmOrderReceived = "سفارش جدید مزرعه";
    public const string OrderCreated = "سفارش ایجاد شد";
    public const string OrderApproved = "سفارش تأیید شد";
    public const string OrderReady = "سفارش آماده شد";
    public const string OrderPaid = "سفارش پرداخت شد";
    public const string OrderRejected = "سفارش رد شد";
    public const string OrderShipped = "سفارش ارسال شد";
    public const string OrderDelivered = "سفارش تحویل داده شد";
    public const string OrderRefunded = "سفارش بازپرداخت شد";
    public const string OrderExpired = "سفارش منقضی شد";
    public const string OrderDeliveryReminder = "سفارش در انتظار تأیید تحویل";
    public const string ServiceRequestCreated = "درخواست خدمات ثبت شد";
    public const string ServiceRequestNew = "درخواست خدمات جدید";
    public const string ServiceRequestStatus = "درخواست خدمات تغییر وضعیت یافت";
    public const string ServiceRequestSchedule = "درخواست خدمات زمان‌بندی شد";
    public const string ServiceRequestAssigned = "درخواست خدمات به متخصص واگذار شد";
    public const string ServiceRequestUnassigned = "درخواست خدمات از متخصص قبلی برداشته شد";
    public const string CheckoutCancelled = "خرید لغو شد";
    public const string CheckoutExpired = "خرید منقضی شد";

    // Accept legacy event codes from administrative API clients as well.
    public static string Localize(string type) => type.Trim() switch
    {
        "OrderSubmitted" => OrderSubmitted,
        "FarmOrderReceived" => FarmOrderReceived,
        "OrderCreated" => OrderCreated,
        "OrderApproved" => OrderApproved,
        "OrderReady" => OrderReady,
        "OrderPaid" => OrderPaid,
        "OrderRejected" => OrderRejected,
        "OrderShipped" => OrderShipped,
        "OrderDelivered" => OrderDelivered,
        "OrderRefunded" => OrderRefunded,
        "OrderExpired" => OrderExpired,
        "OrderDeliveryReminder" => OrderDeliveryReminder,
        "ServiceRequestCreated" => ServiceRequestCreated,
        "ServiceRequestNew" => ServiceRequestNew,
        "ServiceRequestStatus" => ServiceRequestStatus,
        "ServiceRequestSchedule" => ServiceRequestSchedule,
        "ServiceRequestAssigned" => ServiceRequestAssigned,
        "ServiceRequestUnassigned" => ServiceRequestUnassigned,
        "CheckoutCancelled" => CheckoutCancelled,
        "CheckoutExpired" => CheckoutExpired,
        "" => "اعلان جدید",
        var title => title
    };
}
