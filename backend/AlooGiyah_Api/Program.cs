using AlooGiyah_API.Middlewares;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.Store;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Application.Services;
using AlooGiyah_Application.Services.Store;
using AlooGiyah_Application.Services.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Infrastructur.Email;
using AlooGiyah_Infrastructure.Files;
using AlooGiyah_Persistence;
using AlooGiyah_Persistence.Connection;
using AlooGiyah_Persistence.Context;
using AlooGiyah_Persistence.Queries;
using AlooGiyah_Persistence.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

#region DbContext

//builder.Services.AddDbContext<AlooGiyahDbContext>(opt =>
//    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDbContext<AlooGiyahDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
#endregion

#region Authentication jwt
var jwt = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwt["Key"]!);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.RequireHttpsMetadata = false;
        opts.SaveToken = true;
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = jwt["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwt["Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

#endregion

#region Authorization Policies

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("NotGuest", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireAssertion(context => !context.User.IsInRole("Guest"));
    });
});

#endregion


#region CORS
builder.Services.AddCors(o => o.AddPolicy("AllowAll", p =>
  p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));
#endregion

// — Controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

#region Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AloGiyah API", Version = "v1" });

    // JWT Authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "????? JWT ?? ?? ????: Bearer {token} ???? ????"
    });

    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});
#endregion

#region Enums Text
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
#endregion

#region DI
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IServiceRequestService, ServiceRequestService>();
builder.Services.AddScoped<IAddressService, AddressService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IArticleService, ArticleService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IOrderItemService, OrderItemService>();
builder.Services.AddScoped<IDiscountService, DiscountService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<IQualityAssessmentService, QualityAssessmentService>();
builder.Services.AddScoped<IChatMessageService, ChatMessageService>();
builder.Services.AddScoped<IAgriculturalProductService, AgriculturalProductService>();
builder.Services.AddScoped<IAgriculturalOrderService, AgriculturalOrderService>();
builder.Services.AddScoped<ICheckoutService, CheckoutService>();
builder.Services.AddHostedService<AlooGiyah_Api.BackgroundServices.CheckoutExpiryWorker>();
builder.Services.AddScoped<IAgriculturalOrderItemService, AgriculturalOrderItemService>();
builder.Services.AddScoped<IAuctionService, AuctionService>();
builder.Services.AddScoped<IAuctionBidService, AuctionBidService>();
builder.Services.AddScoped<IStatusService, StatusService>();
builder.Services.AddScoped<IWarehouseService, WarehouseService>();
builder.Services.AddScoped<IWarehouseInventoryService, WarehouseInventoryService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IFarmService, FarmService>();
builder.Services.AddScoped<IPriceCalculatorService, PriceCalculatorService>();
builder.Services.AddScoped<IWalletService, WalletService>();
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<ISliderService, SliderService>();
builder.Services.AddScoped<INotificationService, NotificationService>();



builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IFileRepository, FileRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRepositoryFactory, RepositoryFactory>();
builder.Services.AddScoped<IServiceRequestRepository, ServiceRequestRepository>();
builder.Services.AddScoped<ICartRepository,CartRepository>();
builder.Services.AddScoped<IDbConnectionFactory, SqlConnectionFactory>();


builder.Services.AddScoped<IAddressQuery, AddressQuery>();
builder.Services.AddScoped<ICategoryQuery, CategoryQuery>();
builder.Services.AddScoped<IFileQuery, FileQuery>();
builder.Services.AddScoped<IWalletQuery, WalletQuery>();
builder.Services.AddScoped<INotificationQuery, NotificationQuery>();
builder.Services.AddScoped<ISliderQuery, SliderQuery>();
builder.Services.AddScoped<ILocationQuery, LocationQuery>();
builder.Services.AddScoped<ICommentQuery, CommentQuery>();
builder.Services.AddScoped<IDiscountQuery, DiscountQuery>();
builder.Services.AddScoped<IAgriculturalOrderQuery, AgriculturalOrderQuery>();
builder.Services.AddScoped<ICheckoutQuery, CheckoutQuery>();
builder.Services.AddScoped<IAgriculturalOrderItemQuery, AgriculturalOrderItemQuery>();
builder.Services.AddScoped<ICartQuery, CartQuery>();
builder.Services.AddScoped<IUserQuery, UserQuery>();
builder.Services.AddScoped<IStatusQuery, StatusQuery>();
builder.Services.AddScoped<IWarehouseQuery, WarehouseQuery>();
builder.Services.AddScoped<IWarehouseInventoryQuery, WarehouseInventoryQuery>();
builder.Services.AddScoped<IQualityAssessmentQuery, QualityAssessmentQuery>();
builder.Services.AddScoped<IStatusChangeLogQuery, StatusChangeLogQuery>();
builder.Services.AddScoped<IServiceRequestQuery, ServiceRequestQuery>();
builder.Services.AddScoped<IChatMessageQuery, ChatMessageQuery>();
builder.Services.AddScoped<IAuctionBidQuery, AuctionBidQuery>();
builder.Services.AddScoped<IAuctionQuery, AuctionQuery>();
builder.Services.AddScoped<IArticleQuery, ArticleQuery>();
builder.Services.AddScoped<IProductQuery, ProductQuery>();
builder.Services.AddScoped<IOrderQuery, OrderQuery>();
builder.Services.AddScoped<IOrderItemQuery, OrderItemQuery>();
builder.Services.AddScoped<IFarmQuery, FarmQuery>();
builder.Services.AddScoped<IAgriculturalProductQuery, AgriculturalProductQuery>();

builder.Services.AddScoped<IEmail, Email>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddHttpClient<IPaymentGatewayService, PaymentGatewayService>();
builder.Services.AddHttpContextAccessor();

//builder.Services.AddScoped<IRequestService, RequestService>();
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddAutoMapper(cfg =>
{
    var licenseKey = builder.Configuration["AutoMapper:LicenseKey"];
    if (!string.IsNullOrWhiteSpace(licenseKey))
        cfg.LicenseKey = licenseKey;
}, AppDomain.CurrentDomain.GetAssemblies());
builder.Services.AddMemoryCache();
#endregion


    var app = builder.Build();

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<ExceptionMiddleware>();

#region file
var uploadPath = builder.Configuration["FileStorage:UploadPath"]
                 ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "AlooGiyah", "Uploads");

if (!Directory.Exists(uploadPath))
    Directory.CreateDirectory(uploadPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadPath),
    RequestPath = "/uploads",
    ServeUnknownFileTypes = true,
    DefaultContentType = "application/octet-stream"
});

app.UseFileServer(new FileServerOptions
{
    FileProvider = new PhysicalFileProvider(uploadPath),
    RequestPath = "/uploads",
    EnableDirectoryBrowsing = false
});
#endregion

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

app.Run();

