using System.Text.Json.Serialization;
namespace AlooGiyah_Domain.Enums;
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AgriculturalOrderAction { Approve, Reject, Ship, ConfirmDelivery }
