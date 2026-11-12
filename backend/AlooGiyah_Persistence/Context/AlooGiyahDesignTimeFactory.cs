using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
namespace AlooGiyah_Persistence.Context;
public sealed class AlooGiyahDesignTimeFactory : IDesignTimeDbContextFactory<AlooGiyahDbContext>
{
    public AlooGiyahDbContext CreateDbContext(string[] args)
    {
        var directory = new DirectoryInfo(Directory.GetCurrentDirectory());
        string? settingsDirectory = null;
        while (directory != null)
        {
            var api = Path.Combine(directory.FullName, "AlooGiyah_Api");
            if (File.Exists(Path.Combine(api, "appsettings.json"))) { settingsDirectory = api; break; }
            if (directory.Name == "AlooGiyah_Api" && File.Exists(Path.Combine(directory.FullName, "appsettings.json")))
            { settingsDirectory = directory.FullName; break; }
            directory = directory.Parent;
        }
        var builder = new ConfigurationBuilder();
        if (settingsDirectory != null)
        {
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
            builder.SetBasePath(settingsDirectory).AddJsonFile("appsettings.json", optional: false)
                .AddJsonFile($"appsettings.{environment}.json", optional: true);
        }
        var configuration = builder.Build();
        var connection = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required for EF tooling.");
        return new AlooGiyahDbContext(new DbContextOptionsBuilder<AlooGiyahDbContext>().UseNpgsql(connection).Options);
    }
}
