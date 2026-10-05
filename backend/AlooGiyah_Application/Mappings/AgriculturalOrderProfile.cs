using AutoMapper;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Application.DTOs.AgriculturalOrderItem;
namespace AlooGiyah_Application.Mappings;
public class AgriculturalOrderProfile : AutoMapper.Profile
{
    public AgriculturalOrderProfile()
    {
        CreateMap<AgriculturalOrderItem, AgriculturalOrderItemDto>()
            .ForMember(d => d.AgriculturalProductCode, o => o.MapFrom(s => s.ProductCodeSnapshot == "" ? s.AgriculturalProduct.Code : s.ProductCodeSnapshot))
            .ForMember(d => d.ProductName, o => o.MapFrom(s => s.ProductNameSnapshot == "" ? s.AgriculturalProduct.Name : s.ProductNameSnapshot))
            .ForMember(d => d.ProductSlug, o => o.MapFrom(s => s.ProductSlugSnapshot == "" ? s.AgriculturalProduct.Slug : s.ProductSlugSnapshot))
            .ForMember(d => d.LineTotal, o => o.MapFrom(s => s.Quantity * s.Price));
        CreateMap<AgriculturalOrderHistory, OrderHistoryDto>();
        CreateMap<AgriculturalOrder, AgriculturalOrderDto>()
            .ForMember(d => d.Address, o => o.MapFrom(s => ReadAddress(s.AddressSnapshotJson)))
            .ForMember(d => d.CheckoutCode, o => o.MapFrom(s => s.Checkout == null ? null : s.Checkout.Code))
            .ForMember(d => d.FarmCode, o => o.MapFrom(s => s.Farm == null ? null : s.Farm.Code))
            .ForMember(d => d.FarmName, o => o.MapFrom(s => s.FarmNameSnapshot))
            .ForMember(d => d.BuyerCode, o => o.MapFrom(s => s.Buyer.Code))
            .ForMember(d => d.StatusCode, o => o.MapFrom(s => s.Status.Code))
            .ForMember(d => d.StatusTitle, o => o.MapFrom(s => s.Status.Name))
            .ForMember(d => d.OrderItems, o => o.MapFrom(s => s.AgriculturalOrderItems))
            .ForMember(d => d.RefundStatus, o => o.MapFrom(s => s.Refund == null ? "None" : s.Refund.Status))
            .ForMember(d => d.RefundAmount, o => o.MapFrom(s => s.Refund == null ? 0m : s.Refund.Amount))
            .ForMember(d => d.RefundReference, o => o.MapFrom(s => s.Refund == null ? null : s.Refund.Reference))
            .ForMember(d => d.RefundCompletedAt, o => o.MapFrom(s => s.Refund == null ? (DateTimeOffset?)null : s.Refund.CompletedAt))
            .ForMember(d => d.AllowedActions, o => o.Ignore());
        CreateMap<Checkout, CheckoutDto>()
            .ForMember(d => d.IsSubmitted, o => o.MapFrom(s => s.IsSubmitted || s.IsPaid));
    }
    private static OrderAddressDto? ReadAddress(string json) => string.IsNullOrWhiteSpace(json) ? null :
        System.Text.Json.JsonSerializer.Deserialize<OrderAddressDto>(json);
}
