using AlooGiyah_API.Middlewares;
using AlooGiyah_Api.Realtime;
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
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: false);
    builder.Configuration.AddEnvironmentVariables();
    builder.Configuration.AddCommandLine(args);
}
builder.Services.AddHttpClient("phone-otp", client =>
{
    client.BaseAddress = new Uri("https://console.melipayamak.com/");
    client.Timeout = TimeSpan.FromSeconds(12);
}).RemoveAllLoggers();
builder.Services.AddScoped<IPhoneCodeSender, AlooGiyah_Api.Sms.MelipayamakPhoneCodeSender>();
builder.Services.AddHttpClient("map-search", client => client.Timeout = TimeSpan.FromSeconds(12));
builder.Services.AddHttpClient("expo-push", client => client.Timeout = TimeSpan.FromSeconds(8));
builder.Services.AddSingleton<AlooGiyah_Api.BackgroundServices.ChatPushQueue>();
builder.Services.AddHostedService<AlooGiyah_Api.BackgroundServices.ChatPushWorker>();
builder.Services.AddHostedService<AlooGiyah_Api.BackgroundServices.AccountFileDeletionWorker>();
builder.Services.AddSingleton<AlooGiyah_Application.Services.ContentModeration>();
builder.Services.AddSingleton<AlooGiyah_Api.Maps.MapSearchService>();

if (string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("DefaultConnection")))
    throw new InvalidOperationException("ConnectionStrings__DefaultConnection must be configured.");
var signingKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(signingKey) || Encoding.UTF8.GetByteCount(signingKey) < 32)
    throw new InvalidOperationException("Jwt__Key must contain at least 32 bytes of random secret material.");
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
if (!builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)
    throw new InvalidOperationException("Cors__AllowedOrigins must list the public web and admin origins.");
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    foreach (var proxy in (builder.Configuration.GetSection("ReverseProxy:KnownProxies").Get<string[]>() ?? []).Where(value => !string.IsNullOrWhiteSpace(value)))
        options.KnownProxies.Add(System.Net.IPAddress.Parse(proxy));
});
builder.Services.AddSingleton<AlooGiyah_Api.RateLimiting.IpTrafficMiddleware>();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (rejected, cancellationToken) =>
    {
        var context = rejected.HttpContext;
        context.Response.Headers.CacheControl = "no-store";
        var seconds = rejected.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)
            ? Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds)) : 60;
        context.Response.Headers.RetryAfter = seconds.ToString(System.Globalization.CultureInfo.InvariantCulture);
        var policy = context.GetEndpoint()?.Metadata.GetMetadata<EnableRateLimitingAttribute>()?.PolicyName ?? "global";
        context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("RateLimiting")
            .LogWarning("Rate limit rejected request. Endpoint policy: {Policy}; Path: {Path}; Retry after: {Seconds}s",
                policy, context.Request.Path, seconds);
        await context.Response.WriteAsJsonAsync(
            new AlooGiyah_Application.Commons.ApiResponse<object>(
                "تعداد درخواست‌ها زیاد است. لطفاً کمی صبر کنید و دوباره تلاش کنید.", "RATE_LIMITED"), cancellationToken);
    };
    options.AddPolicy("map-search", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 12, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
    options.GlobalLimiter = AlooGiyah_Api.RateLimiting.GlobalTrafficLimiter.Create(builder.Configuration);
    foreach (var (name, limit) in new[] { ("chat-send", 30), ("chat-file", 5), ("chat-room", 5), ("chat-connect", 20), ("product-report", 5), ("product-inquiry", 10), ("farm-contact", 12) })
        options.AddPolicy(name, context => RateLimitPartition.GetFixedWindowLimiter(
            AlooGiyah_Api.RateLimiting.ClientPartition.Key(context),
            _ => new FixedWindowRateLimiterOptions {
                PermitLimit = builder.Configuration.GetValue($"TrafficLimits:{name}", limit),
                Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0
        }));
});

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
        opts.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
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
        opts.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"].ToString();
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrWhiteSpace(accessToken) && path.StartsWithSegments("/ws/chat"))
                    context.Token = accessToken.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                        ? accessToken[7..].Trim()
                        : accessToken.Trim();
                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var principal = context.Principal;
                var userId = principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!int.TryParse(userId, out var id)) return;

                var tokenVersion = principal?.FindFirst("TokenVersion")?.Value;
                if (!int.TryParse(tokenVersion, out var version))
                {
                    context.Fail("توکن نیاز به ورود مجدد دارد.");
                    return;
                }

                var db = context.HttpContext.RequestServices.GetRequiredService<AlooGiyahDbContext>();
                var currentVersion = await db.Users.AsNoTracking()
                    .Where(user => user.UserId == id && !user.IsDeleted)
                    .Select(user => (int?)user.TokenVersion)
                    .SingleOrDefaultAsync(context.HttpContext.RequestAborted);
                if (currentVersion != version)
                    context.Fail("توکن منقضی شده است. دوباره وارد شوید.");
            }
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
builder.Services.AddSingleton<Microsoft.AspNetCore.Authorization.IAuthorizationHandler, AlooGiyah_Api.Authorization.ManagerRoleHandler>();

#endregion


#region CORS
builder.Services.AddCors(o => o.AddPolicy("ConfiguredOrigins", p =>
{
    if (builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)
        p.AllowAnyOrigin();
    else
        p.WithOrigins(allowedOrigins);
    p.AllowAnyMethod().AllowAnyHeader();
}));
#endregion

// — Controllers
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
builder.Services.AddSingleton<AlooGiyah_Api.Caching.CatalogCacheFilter>();
builder.Services.AddControllers(options => options.Filters.AddService<AlooGiyah_Api.Caching.CatalogCacheFilter>())
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddSingleton<ChatConnectionManager>();
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
builder.Services.AddScoped<ISavedProductService, SavedProductService>();
builder.Services.AddScoped<IQualityAssessmentService, QualityAssessmentService>();
builder.Services.AddScoped<IChatMessageService, ChatMessageService>();
builder.Services.AddScoped<IAgriculturalProductService, AgriculturalProductService>();
builder.Services.AddScoped<IAgriculturalOrderService, AgriculturalOrderService>();
builder.Services.AddScoped<ICheckoutService, CheckoutService>();
builder.Services.AddScoped<IProductInquiryService, ProductInquiryService>();
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
builder.Services.AddScoped<AlooGiyah_Application.Services.Store.SettlementService>();
builder.Services.AddScoped<DeliveryService>();
builder.Services.AddScoped<AlooGiyah_Application.Services.Store.SellerSalesService>();
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<ISliderService, SliderService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<INotificationWriter, NotificationWriter>();



builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IFileRepository, FileRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRepositoryFactory, RepositoryFactory>();
builder.Services.AddScoped<IServiceRequestRepository, ServiceRequestRepository>();
builder.Services.AddScoped<ICartRepository,CartRepository>();
builder.Services.AddScoped<IDbConnectionFactory, PostgresConnectionFactory>();


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
builder.Services.AddScoped<IChatFileStorage, ChatFileStorage>();
builder.Services.AddScoped<IBusinessDocumentStorage, BusinessDocumentStorage>();
builder.Services.AddHttpClient<IPaymentGatewayService, PaymentGatewayService>();
builder.Services.AddSingleton<IPayoutProvider, UnavailablePayoutProvider>();
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

if (args.Contains("--migrate", StringComparer.Ordinal))
{
    await using var scope = app.Services.CreateAsyncScope();
    await scope.ServiceProvider.GetRequiredService<AlooGiyahDbContext>().Database.MigrateAsync();
    return;
}

app.UseForwardedHeaders();
app.UseMiddleware<ExceptionMiddleware>();
if (builder.Configuration.GetValue("Hosting:UseHttpsRedirection", true))
    app.UseHttpsRedirection();

app.UseCors("ConfiguredOrigins");

// The marketplace currently runs as a direct-listing service: buyer and seller
// coordinate through an inquiry and chat.  Keeping the former commerce APIs
// behind one switch makes their return deliberate rather than accidental.
var marketplaceMode = builder.Configuration["Marketplace:Mode"] ?? "Listings";
if (string.Equals(marketplaceMode, "Listings", StringComparison.OrdinalIgnoreCase))
{
    var pausedCommercePrefixes = new[]
    {
        "/api/Cart", "/api/Checkout", "/api/Wallet", "/api/Settlement",
        "/api/Delivery", "/api/AgriculturalOrder", "/api/AgriculturalOrderItem",
        "/api/SellerSales", "/api/ServiceRequest", "/api/QualityAssessment",
        "/api/Auction", "/api/AuctionBid", "/api/Discount", "/api/Order",
        "/api/Warehouse", "/api/WarehouseInventory"
    };
    app.Use(async (context, next) =>
    {
        if (pausedCommercePrefixes.Any(prefix => context.Request.Path.StartsWithSegments(prefix)))
        {
            context.Response.StatusCode = StatusCodes.Status410Gone;
            context.Response.Headers.CacheControl = "no-store";
            await context.Response.WriteAsJsonAsync(
                new AlooGiyah_Application.Commons.ApiResponse<object>(
                    "خرید و پرداخت آنلاین فعلاً غیرفعال است. برای هماهنگی مستقیم، درخواست خرید ثبت کنید.",
                    "DIRECT_LISTINGS_MODE"));
            return;
        }

        await next();
    });
}

app.Use(async (context, next) =>
{
    context.Response.OnStarting(() => {
        if (!context.Response.Headers.ContainsKey("Cache-Control"))
            context.Response.Headers.CacheControl = "no-store";
        return Task.CompletedTask;
    });
    await next();
});
app.UseMiddleware<AlooGiyah_Api.RateLimiting.IpTrafficMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.UseWebSockets();


#region file
var uploadPath = builder.Configuration["FileStorage:UploadPath"]
                 ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "AlooGiyah", "Uploads");

if (!Directory.Exists(uploadPath))
    Directory.CreateDirectory(uploadPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadPath),
    RequestPath = "/uploads",
    ServeUnknownFileTypes = false,
    DefaultContentType = "application/octet-stream",
    OnPrepareResponse = context => context.Context.Response.Headers["X-Content-Type-Options"] = "nosniff"
});

#endregion

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/health/live", () => Results.Ok(new { status = "ok" })).AllowAnonymous();
app.MapGet("/health/ready", async (AlooGiyahDbContext db, CancellationToken cancellationToken) =>
{
    if (!await db.Database.CanConnectAsync(cancellationToken) ||
        (await db.Database.GetPendingMigrationsAsync(cancellationToken)).Any())
        return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
    var hasDefaultRole = await db.Roles.AnyAsync(x => !x.IsDeleted && x.Name == "User", cancellationToken);
    var orderCodes = new[] {
        AlooGiyah_Shared.Constants.AgriculturalOrderStatuses.PendingPayment,
        AlooGiyah_Shared.Constants.AgriculturalOrderStatuses.PaymentFailed,
        AlooGiyah_Shared.Constants.AgriculturalOrderStatuses.CheckingInventory,
        AlooGiyah_Shared.Constants.AgriculturalOrderStatuses.Approved,
        AlooGiyah_Shared.Constants.AgriculturalOrderStatuses.Shipped,
        AlooGiyah_Shared.Constants.AgriculturalOrderStatuses.Delivered,
        AlooGiyah_Shared.Constants.AgriculturalOrderStatuses.Rejected
    };
    var orderStatusCount = await db.Statuses.CountAsync(x => !x.IsDeleted && orderCodes.Contains(x.Code), cancellationToken);
    return hasDefaultRole && orderStatusCount == orderCodes.Length
        ? Results.Ok(new { status = "ready" })
        : Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
}).AllowAnonymous();

app.MapControllers();
app.Map("/ws/chat", async context =>
{
    if (context.User.Identity?.IsAuthenticated != true || context.User.IsInRole("Guest"))
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return;
    }
    var userCode = context.User.FindFirst("Code")?.Value;
    if (string.IsNullOrWhiteSpace(userCode) || !context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        return;
    }
    using var socket = await context.WebSockets.AcceptWebSocketAsync();
    var db = context.RequestServices.GetRequiredService<AlooGiyahDbContext>();
    async Task<string?> ResolveRoomPeer(string roomCode, CancellationToken cancellationToken) =>
        await db.ChatConversations.AsNoTracking()
            .Where(room => room.Code == roomCode && !room.IsDeleted &&
                !room.ParticipantOne.IsDeleted && !room.ParticipantTwo.IsDeleted &&
                !db.ChatConversationBlocks.Any(block => block.ConversationId == room.ChatConversationId && !block.IsDeleted) &&
                (room.ParticipantOne.Code == userCode || room.ParticipantTwo.Code == userCode))
            .Select(room => room.ParticipantOne.Code == userCode
                ? room.ParticipantTwo.Code
                : room.ParticipantOne.Code)
            .SingleOrDefaultAsync(cancellationToken);

    await context.RequestServices.GetRequiredService<ChatConnectionManager>()
        .RunAsync(userCode, socket, ResolveRoomPeer, context.RequestAborted);
}).RequireRateLimiting("chat-connect");

app.Run();
