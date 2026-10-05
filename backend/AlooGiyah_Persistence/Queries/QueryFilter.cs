using Dapper;
namespace AlooGiyah_Persistence.Queries;
// SQL fragments are code constants. Every request value is a bound parameter.
public sealed class QueryFilter
{
    private readonly List<string> _conditions = new() { "NOT t.\"IsDeleted\"" };
    public DynamicParameters Parameters { get; } = new();
    public string Where => "WHERE " + string.Join(" AND ", _conditions);
    public void Add(string condition) => _conditions.Add(condition);
    public void Add(string condition, string parameter, object value)
    { _conditions.Add(condition); Parameters.Add(parameter, value is DateTimeOffset date ? date.ToUniversalTime() : value); }
    public void Equal(string column, string name, object? value)
    { if (value != null && (value is not string text || !string.IsNullOrWhiteSpace(text))) Add(column + " = @" + name, name, value); }
    public void Compare(string column, string operation, string name, object? value)
    { if (value != null) Add(column + " " + operation + " @" + name, name, value); }
    public void Contains(string column, string name, string? value)
    { if (!string.IsNullOrWhiteSpace(value)) Add("strpos(" + column + ", @" + name + ") > 0", name, value); }
}
