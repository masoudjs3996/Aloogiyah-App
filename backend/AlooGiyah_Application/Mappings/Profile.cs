using AlooGiyah_Application.DTOs.Address;
using AlooGiyah_Application.DTOs.AgriculturalOrder;
using AlooGiyah_Application.DTOs.AgriculturalOrderItem;
using AlooGiyah_Application.DTOs.AgriculturalProduct;
using AlooGiyah_Application.DTOs.Auction;
using AlooGiyah_Application.DTOs.AuctionBid;
using AlooGiyah_Application.DTOs.Cart;
using AlooGiyah_Application.DTOs.Category;
using AlooGiyah_Application.DTOs.ChatMessage;
using AlooGiyah_Application.DTOs.Comment;
using AlooGiyah_Application.DTOs.Discount;
using AlooGiyah_Application.DTOs.Farm;
using AlooGiyah_Application.DTOs.File;
using AlooGiyah_Application.DTOs.Location;
using AlooGiyah_Application.DTOs.Notification;
using AlooGiyah_Application.DTOs.Order;
using AlooGiyah_Application.DTOs.OrderItem;
using AlooGiyah_Application.DTOs.Product;
using AlooGiyah_Application.DTOs.QualityAssessment;
using AlooGiyah_Application.DTOs.ServiceRequest;
using AlooGiyah_Application.DTOs.Status;
using AlooGiyah_Application.DTOs.Users;
using AlooGiyah_Application.DTOs.Wallet;
using AlooGiyah_Application.DTOs.Warehouse;
using AlooGiyah_Application.DTOs.WarehouseInventory;
using AlooGiyah_Application.Utils;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;

namespace AlooGiyah_Application.Mappings
{
    public class Profile : AutoMapper.Profile
    {
        public Profile()
        {
            #region User
            CreateMap<RegisterUserDto, User>();
            CreateMap<User, RegisterUserDto>();
            CreateMap<User, UserDto>()
                 .ForMember(d => d.RoleCode,
        opt => opt.MapFrom(s => s.Role.Code))
    .ForMember(d => d.RoleName,
        opt => opt.MapFrom(s => s.Role.Name));
            CreateMap<UpdateProfileDto, User>();
            CreateMap<ChangePasswordDto, User>();
            CreateMap<User, ChangePasswordDto>();
            CreateMap<ChangeUsernameDto, User>();
            CreateMap<UpdateProfileDto, User>();
            CreateMap<VerifyEmailDto, User>();
            #endregion

            #region File
            CreateMap<FileUploadDto, Files>()
                .ForMember(dest => dest.FileTypeId, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.Url, opt => opt.Ignore());
            CreateMap<Files, FileDto>()
                .ForMember(dest => dest.FileCode, opt => opt.MapFrom(src => src.Code))
                .ForMember(dest => dest.FileTypeCode, opt => opt.MapFrom(src => src.FileType.Code))
                .ForMember(dest => dest.UserCode, opt => opt.MapFrom(src => src.User.Code));
            #endregion

            #region ServiceRequest
            CreateMap<ServiceRequest, ServiceRequestDto>().ReverseMap();
            CreateMap<ServiceRequestCreateDto, ServiceRequest>().ReverseMap();
            CreateMap<ServiceRequestUpdateDto, ServiceRequest>().ReverseMap();
            #endregion

            #region Category
            CreateMap<Category, CategoryDto>();
            CreateMap<CategoryCreateDto, Category>();
            CreateMap<CategoryUpdateDto, Category>();
            #endregion

            #region Address
            CreateMap<AddressCreateDto, Address>()
                .ForMember(d => d.ProvinceId, opt => opt.Ignore())
                .ForMember(d => d.CountyId, opt => opt.Ignore())
                .ForMember(d => d.CityId, opt => opt.Ignore());

            CreateMap<AddressUpdateDto, Address>()
                .ForMember(d => d.ProvinceId, opt => opt.Ignore())
                .ForMember(d => d.CountyId, opt => opt.Ignore())
                .ForMember(d => d.CityId, opt => opt.Ignore());

            CreateMap<Address, AddressDto>();
            #endregion

            #region Product
            CreateMap<Product, ProductDto>()
                .ForMember(dest => dest.CategoryCodes, opt => opt.Ignore());
            CreateMap<ProductCreateDto, Product>();
            CreateMap<ProductUpdateDto, Product>();
            #endregion

            #region Order
            CreateMap<Order, OrderDto>()
                .ForMember(dest => dest.UserCode, opt => opt.Ignore())
                .ForMember(dest => dest.StatusCode, opt => opt.Ignore())
                .ForMember(dest => dest.AddressCode, opt => opt.Ignore())
                .ForMember(dest => dest.DiscountCode, opt => opt.Ignore())
                .ForMember(dest => dest.Items, opt => opt.Ignore());
            CreateMap<OrderCreateDto, Order>();
            CreateMap<OrderUpdateDto, Order>();
            #endregion

            #region OrderItem
            CreateMap<OrderItemCreateDto, OrderItem>();
            CreateMap<OrderItemUpdateDto, OrderItem>();
            CreateMap<OrderItem, OrderItemDto>()
                .ForMember(dest => dest.ProductCode, opt => opt.Ignore());
            #endregion

            #region Discount
            CreateMap<Discount, DiscountDto>()
     .ForMember(dest => dest.Entity, opt => opt.MapFrom(src => src))
     .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.GetDiscountDescription()))
     .ForMember(dest => dest.UserCodes, opt => opt.MapFrom(src =>
         src.Users != null ? src.Users.Select(u => u.Code).ToList() : new List<string>()))
     .ForMember(dest => dest.ProductCodes, opt => opt.MapFrom(src =>
         src.Products != null ? src.Products.Select(p => p.Code).ToList() : new List<string>()))
     .ForMember(dest => dest.CategoryCodes, opt => opt.MapFrom(src =>
         src.Categories != null ? src.Categories.Select(c => c.Code).ToList() : new List<string>()))
     .ForMember(dest => dest.FarmCode, opt => opt.MapFrom(src =>
         src.Farm != null ? src.Farm.Code : null))
     .ForMember(dest => dest.RootCategoryCodes, opt => opt.MapFrom(src =>
        src.Categories != null && src.Categories.Any()
            ? string.Join(",", src.Categories
                .Select(c => c.GetRootParent())
                .DistinctBy(rc => rc.CategoryId)
                .OrderBy(rc => rc.SortOrder)
                .Select(rc => rc.Code))
            : null))
    .ForMember(dest => dest.RootCategoryNames, opt => opt.MapFrom(src =>
        src.Categories != null && src.Categories.Any()
            ? string.Join("، ", src.Categories
                .Select(c => c.GetRootParent())
                .DistinctBy(rc => rc.CategoryId)
                .OrderBy(rc => rc.SortOrder)
                .Select(rc => rc.Name))
            : null));
            CreateMap<DiscountCreateDto, Discount>();
            CreateMap<DiscountUpdateDto, Discount>();
            #endregion

            #region Comment
            CreateMap<Comment, CommentDto>()
                .ForMember(dest => dest.UserCode, opt => opt.Ignore())
                .ForMember(dest => dest.EntityComment, opt => opt.MapFrom(src => src.EntityComment.ToString()));
            CreateMap<CommentCreateDto, Comment>()
                .ForMember(dest => dest.EntityComment, opt => opt.Ignore());
            CreateMap<CommentUpdateDto, Comment>();
            #endregion

            #region QualityAssessment
            CreateMap<QualityAssessment, QualityAssessmentDto>()
                .ForMember(dest => dest.AgriculturalProductCode, opt => opt.Ignore())
                .ForMember(dest => dest.ExpertCode, opt => opt.Ignore());
            CreateMap<QualityAssessmentCreateDto, QualityAssessment>();
            CreateMap<QualityAssessmentUpdateDto, QualityAssessment>();
            #endregion

            #region ChatMessage
            CreateMap<ChatMessage, ChatMessageDto>()
                .ForMember(dest => dest.SenderCode, opt => opt.Ignore())
                .ForMember(dest => dest.ReceiverCode, opt => opt.Ignore());
            CreateMap<ChatMessageCreateDto, ChatMessage>();
            CreateMap<ChatMessageUpdateDto, ChatMessage>();
            #endregion

            #region AgriculturalProduct
            CreateMap<AgriculturalProduct, AgriculturalProductDetailDto>()
            .ForMember(dest => dest.PrimaryImageUrl, opt => opt.Ignore()) // چون دستی پر می‌کنیم
            .ForMember(dest => dest.ImageUrls, opt => opt.Ignore());      // چون دستی پر می‌کنیم

            // اگر AgriculturalProductListItemDto داری:
            CreateMap<AgriculturalProduct, AgriculturalProductListItemDto>()
                .ForMember(dest => dest.PrimaryImageUrl, opt => opt.Ignore());

            CreateMap<AgriculturalProduct, AgriculturalProductDto>()
                .ForMember(dest => dest.GreenhouseCode, opt => opt.Ignore())
                .ForMember(dest => dest.StatusCode, opt => opt.Ignore())
                .ForMember(dest => dest.CategoryCodes, opt => opt.MapFrom(src => src.Categories.Select(c => c.Code).ToList()));
            CreateMap<AgriculturalProductCreateDto, AgriculturalProduct>()
                .ForMember(dest => dest.Categories, opt => opt.Ignore());
            CreateMap<AgriculturalProductUpdateDto, AgriculturalProduct>()
                .ForMember(dest => dest.Categories, opt => opt.Ignore());
            #endregion

            #region Auction
            CreateMap<Auction, AuctionDto>()
                .ForMember(dest => dest.AgriculturalProductCode, opt => opt.Ignore())
                .ForMember(dest => dest.StatusCode, opt => opt.Ignore())
                .ForMember(dest => dest.WinnerCode, opt => opt.Ignore())
                .ForMember(dest => dest.Bids, opt => opt.Ignore());
            CreateMap<AuctionCreateDto, Auction>();
            CreateMap<AuctionUpdateDto, Auction>()
                .ForMember(dest => dest.WinnerId, opt => opt.Ignore());
            #endregion

            #region AuctionBid
            CreateMap<AuctionBid, AuctionBidDto>();
            CreateMap<AuctionBidCreateDto, AuctionBid>();
            CreateMap<AuctionBidUpdateDto, AuctionBid>();
            #endregion

            #region Status
            CreateMap<Status, StatusDto>();
            CreateMap<StatusCreateDto, Status>();
            CreateMap<StatusUpdateDto, Status>();
            #endregion

            #region Warehouse
            CreateMap<Warehouse, WarehouseDto>()
                .ForMember(dest => dest.FarmerCode, opt => opt.Ignore());
            CreateMap<WarehouseCreateDto, Warehouse>()
                .ForMember(dest => dest.FarmerId, opt => opt.Ignore());
            CreateMap<WarehouseUpdateDto, Warehouse>()
                .ForMember(dest => dest.FarmerId, opt => opt.Ignore());
            #endregion

            #region WarehouseInventory
            CreateMap<WarehouseInventory, WarehouseInventoryDto>()
                .ForMember(dest => dest.WarehouseCode, opt => opt.Ignore())
                .ForMember(dest => dest.EntityCode, opt => opt.Ignore());
            CreateMap<WarehouseInventoryCreateDto, WarehouseInventory>()
                .ForMember(dest => dest.WarehouseId, opt => opt.Ignore())
                .ForMember(dest => dest.EntityId, opt => opt.Ignore());
            CreateMap<WarehouseInventoryUpdateDto, WarehouseInventory>();
            #endregion

            #region Wallet

            CreateMap<Wallet, WalletDto>();
            CreateMap<DepositResultDto, Wallet>();
            CreateMap<DepositWalletDto, Wallet>();


            #endregion

            #region Farm
            CreateMap<Farm, FarmDto>()
                .ForMember(dest => dest.OwnerCode, opt => opt.MapFrom(src => src.Owner.Code))
                .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.Address != null ? new AddressDto
                {
                    Code = src.Address.Code,
                    Street = src.Address.Street,
                    PostalCode = src.Address.PostalCode,
                    Latitude = src.Address.Latitude,
                    Longitude = src.Address.Longitude,
                    IsDefault = src.Address.IsDefault
                } : null))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt));

            CreateMap<FarmCreateDto, Farm>()
                .ForMember(dest => dest.OwnerId, opt => opt.Ignore())
                .ForMember(dest => dest.AddressId, opt => opt.Ignore())
                .ForMember(dest => dest.Capacity, opt => opt.MapFrom(src => src.Capacity));

            CreateMap<FarmUpdateDto, Farm>()
                .ForMember(dest => dest.Code, opt => opt.MapFrom(src => src.Code))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
                .ForMember(dest => dest.Capacity, opt => opt.MapFrom(src => src.Capacity))
                .ForMember(dest => dest.Address, opt => opt.MapFrom(src => src.Address != null ? new Address
                {
                    Street = src.Address.Street,
                    PostalCode = src.Address.PostalCode,
                    Latitude = src.Address.Latitude,
                    Longitude = src.Address.Longitude,
                    IsDefault = src.Address.IsDefault
                } : null));
            #endregion

            #region Location
            // ================= Province =================
            CreateMap<Province, ProvinceDto>();

            CreateMap<ProvinceCreateDto, Province>()
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.Counties, opt => opt.Ignore());

            // ================= County =================
            CreateMap<County, CountyDto>();

            CreateMap<CountyCreateDto, County>()
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.Province, opt => opt.Ignore());

            // ================= City =================
            CreateMap<City, CityDto>();

            CreateMap<CityCreateDto, City>()
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.County, opt => opt.Ignore());

            // ================= Village =================
            CreateMap<Village, VillageDto>();

            CreateMap<VillageCreateDto, Village>()
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.County, opt => opt.Ignore());

            #endregion

            #region Cart
            CreateMap<Cart, CartDto>()
                .ForMember(dest => dest.ItemCount, opt => opt.MapFrom(src => src.CartItems.Sum(i => i.Quantity)))
                .ForMember(dest => dest.TotalPrice, opt => opt.MapFrom(src => src.CartItems.Sum(i => i.Quantity * i.Price)))
                .ForMember(dest => dest.IsGuest, opt => opt.MapFrom(src => src.UserId == null));

            CreateMap<CartItem, CartItemDto>()
                .ForMember(d => d.Code, o => o.MapFrom(s => s.Code))
                .ForMember(d => d.ProductCode, o => o.MapFrom(s => s.AgriculturalProduct.Code))
                .ForMember(d => d.ProductName, o => o.MapFrom(s => s.AgriculturalProduct.Name))
                .ForMember(d => d.ProductSlug, o => o.MapFrom(s => s.AgriculturalProduct.Slug))
                .ForMember(d => d.AvailableStock, o => o.MapFrom(s => s.AgriculturalProduct.Stock))
                .ForMember(d => d.UnitPrice,
                    o => o.MapFrom(s =>
                        s.Quantity == 0 ? 0 : s.Price / s.Quantity))
                .ForMember(d => d.TotalPrice, o => o.Ignore())
                .ForMember(d => d.PrimaryImageUrl, o => o.Ignore()); // ← برای تصویر محصول

            // مپ جدید برای Farm → FarmCartDto
            CreateMap<Farm, FarmCartDto>()
                .ForMember(d => d.FarmCode, o => o.MapFrom(s => s.Code))
                .ForMember(d => d.FarmName, o => o.MapFrom(s => s.Name))
                .ForMember(d => d.TotalPrice, o => o.Ignore()) // در سرویس محاسبه می‌شود
                .ForMember(d => d.DiscountAmount, o => o.Ignore())
                .ForMember(d => d.ImageUrl, o => o.Ignore()) // از سرویس دریافت می‌شود
                .ForMember(d => d.Province, o => o.MapFrom(s =>
                    s.Address != null && s.Address.City != null &&
                    s.Address.City.County != null && s.Address.City.County.Province != null
                        ? s.Address.City.County.Province.Name
                        : null))
                .ForMember(d => d.County, o => o.MapFrom(s =>
                    s.Address != null && s.Address.City != null &&
                    s.Address.City.County != null
                        ? s.Address.City.County.Name
                        : null))
                .ForMember(d => d.Items, o => o.MapFrom(s => s.AgriculturalProduct.SelectMany(p => p.CartItems)));
            // توجه: این ممکن است همه آیتم‌های محصولات را بیاورد، پس بهتر است در سرویس مدیریت شود
            #endregion

            #region Notification
            CreateMap<Notification, NotificationDto>()
                .ForMember(dest => dest.UserCode,
                    opt => opt.MapFrom(src => src.User == null ? null : src.User.Code))
                .ForMember(dest => dest.CreatedAt,
                           opt => opt.MapFrom(src => src.CreatedAt)); // اگر BaseEntity این ویژگی را داشته باشد

            // DTO -> Entity (ایجاد)
            CreateMap<CreateNotificationDto, Notification>()
                .ForMember(dest => dest.NotificationId, opt => opt.Ignore())
                .ForMember(dest => dest.IsRead, opt => opt.MapFrom(src => false))
                .ForMember(dest => dest.User, opt => opt.Ignore()) // relation navigation
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore()); // توسط دیتابیس تنظیم می‌شود
            #endregion
        }
    }
}
