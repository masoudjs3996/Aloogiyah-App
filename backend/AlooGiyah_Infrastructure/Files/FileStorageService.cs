using AlooGiyah_Domain.Enums;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.ValueObjects;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;


namespace AlooGiyah_Infrastructure.Files;

public class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;
    private readonly string _baseUploadPath;

    public FileStorageService(IWebHostEnvironment env, IConfiguration config)
    {
        _baseUploadPath = config.GetValue<string>("FileStorage:UploadPath")
            ?? Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
                "AlooGiyah",
                "Uploads"
            );

        Directory.CreateDirectory(_baseUploadPath);
    }


    public async Task<string> SaveFileAsync(
        IFormFile file,
        EntityFile entityFile,
        string? entityCode = null,
        bool useDateFolder = false)
    {
        string baseFolder = GetBaseFolder(entityFile);
        string finalFolder = baseFolder;

        if (useDateFolder)
        {
            string dateFolder = DateTime.Now.ToString("yyyy-MM-dd");
            finalFolder = Path.Combine(baseFolder, dateFolder);
        }

        // مسیر کامل روی دیسک
        string fullPath = Path.Combine(_baseUploadPath, finalFolder);
        Directory.CreateDirectory(fullPath);

        string uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        string filePathOnDisk = Path.Combine(fullPath, uniqueFileName);

        using (var stream = new FileStream(filePathOnDisk, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // URL نهایی که در دیتابیس ذخیره می‌شه و مرورگر می‌تونه ببینه
        // مثال خروجی: /uploads/products/2025-11-19/abc123.jpg
        string relativeUrl = "/uploads/" + finalFolder.Replace("\\", "/") + "/" + uniqueFileName;

        if (!relativeUrl.StartsWith("/uploads/"))
            relativeUrl = "/uploads/" + relativeUrl;

        return relativeUrl; // نیازی به / اول اضافی نیست چون RequestPath خودش /uploads داره
    }

    public async Task<StoredFile> SaveFileInternalAsync(
    IFormFile file,
    EntityFile entityFile,
    bool useDateFolder)
    {
        string baseFolder = GetBaseFolder(entityFile);
        string finalFolder = baseFolder;

        if (useDateFolder)
            finalFolder = Path.Combine(baseFolder, DateTime.Now.ToString("yyyy-MM-dd"));

        string fullFolderPath = Path.Combine(_baseUploadPath, finalFolder);
        Directory.CreateDirectory(fullFolderPath);

        string fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        string physicalPath = Path.Combine(fullFolderPath, fileName);

        using var stream = new FileStream(physicalPath, FileMode.Create);
        await file.CopyToAsync(stream);

        string relativeUrl = "/uploads/" + finalFolder.Replace("\\", "/") + "/" + fileName;

        return new StoredFile(relativeUrl, physicalPath);
    }


    public Task DeleteFileAsync(string relativeUrl)
    {
        // relativeUrl مثل: /uploads/products/abc123.jpg یا /uploads/products/2025-11-19/abc.jpg

        if (string.IsNullOrEmpty(relativeUrl))
            return Task.CompletedTask;

        // حذف / اول
        var cleanPath = relativeUrl.TrimStart('/');

        // حالا فقط بعد از uploads/ رو بگیر
        var physicalPath = string.Empty;
        if (cleanPath.StartsWith("uploads/"))
            physicalPath = Path.Combine(_baseUploadPath, cleanPath.Substring(8)); // 8 = طول "uploads/"
        else if (cleanPath.StartsWith("uploads\\"))
            physicalPath = Path.Combine(_baseUploadPath, cleanPath.Substring(8));

        if (File.Exists(physicalPath))
            File.Delete(physicalPath);

        return Task.CompletedTask;
    }

    private string GetBaseFolder(EntityFile entityFile) => entityFile switch
    {
        EntityFile.Category => "categories",
        EntityFile.Product => "products",
        EntityFile.Article => "articles",
        EntityFile.Auction => "auctions",
        EntityFile.Profile => "profiles",
        EntityFile.ServiceRequest => "service-requests",
        EntityFile.AgriculturalProduct => "agricultural-products",
        EntityFile.Farm => "Farm",
        EntityFile.Slider => "Slider",
        _ => "others"
    };
}