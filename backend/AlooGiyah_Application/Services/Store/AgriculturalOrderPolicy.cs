using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Enums;
using AlooGiyah_Shared.Constants;
using AlooGiyah_Shared.Exceptions;
namespace AlooGiyah_Application.Services.Store;
public static class AgriculturalOrderPolicy
{
    public static List<string> AllowedActions(AgriculturalOrder order, int userId, bool isManager)
    {
        var actions = new List<string>();
        if (order.CheckoutId == null || order.FarmId == null) return actions;
        var owner = order.Farm?.OwnerId == userId;
        switch (order.Status.Code)
        {
            case AgriculturalOrderStatuses.CheckingInventory when owner && (order.IsHeld || order.IsPaid) &&
                (!order.ApprovalExpiresAt.HasValue || order.ApprovalExpiresAt > DateTimeOffset.UtcNow):
                actions.Add("Approve"); actions.Add("Reject"); break;
            case AgriculturalOrderStatuses.Approved when owner && order.IsPaid:
                actions.Add("Ship"); break;
            case AgriculturalOrderStatuses.Shipped when order.IsPaid && (order.BuyerId == userId || isManager):
                actions.Add("ConfirmDelivery"); break;
        }
        if (isManager && order.Refund?.Status == "Pending") actions.Add("CompleteRefund");
        return actions;
    }
    public static string Target(AgriculturalOrderAction action) => action switch
    {
        AgriculturalOrderAction.Approve => AgriculturalOrderStatuses.Approved,
        AgriculturalOrderAction.Reject => AgriculturalOrderStatuses.Rejected,
        AgriculturalOrderAction.Ship => AgriculturalOrderStatuses.Shipped,
        AgriculturalOrderAction.ConfirmDelivery => AgriculturalOrderStatuses.Delivered,
        _ => throw new BadRequestException("عملیات نامعتبر است.")
    };
}
