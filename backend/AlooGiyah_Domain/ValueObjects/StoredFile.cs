
namespace AlooGiyah_Domain.ValueObjects;

public class StoredFile
{
    public string RelativePath { get; }
    public string PhysicalPath { get; }

    public StoredFile(string relativePath, string physicalPath)
    {
        RelativePath = relativePath;
        PhysicalPath = physicalPath;
    }
}