using AlooGiyah_Application.Interfaces.Service.Store;


namespace AlooGiyah_Api.BackgroundServices;

public class CheckoutExpiryWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<CheckoutExpiryWorker> _logger;

    public CheckoutExpiryWorker(
        IServiceScopeFactory scopes,
        ILogger<CheckoutExpiryWorker> logger)
    {
        _scopes = scopes;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));

        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await RunCheckoutExpiryAsync(stoppingToken);

                await RunAgriculturalOrderExpiryAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // این حالت هنگام Shutdown شدن برنامه طبیعی است.
            _logger.LogInformation("CheckoutExpiryWorker is stopping.");
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "CheckoutExpiryWorker stopped unexpectedly.");
        }
    }

    private async Task RunCheckoutExpiryAsync(
        CancellationToken stoppingToken)
    {
        try
        {
            using var scope = _scopes.CreateScope();

            var checkoutService =
                scope.ServiceProvider.GetRequiredService<ICheckoutService>();

            await checkoutService.ExpireDueAsync();
        }
        catch (OperationCanceledException)
            when (stoppingToken.IsCancellationRequested)
        {
            // Application is shutting down.
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Checkout expiry process failed. It will retry on the next tick.");
        }
    }

    private async Task RunAgriculturalOrderExpiryAsync(
        CancellationToken stoppingToken)
    {
        try
        {
            using var scope = _scopes.CreateScope();

            var agriculturalOrderService =
                scope.ServiceProvider.GetRequiredService<IAgriculturalOrderService>();

            await agriculturalOrderService.ExpireApprovalDueAsync();
        }
        catch (OperationCanceledException)
            when (stoppingToken.IsCancellationRequested)
        {
            // Application is shutting down.
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Agricultural order expiry process failed. It will retry on the next tick.");
        }
    }
}