using AlooGiyah_Application.DTOs.QualityAssessment;
using AlooGiyah_Domain.Pagination;
using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Interfaces;
namespace AlooGiyah_Persistence.Queries;
public class QualityAssessmentQuery : BaseQuery, IQualityAssessmentQuery
{
    private readonly ICurrentUserService _currentUser;
    public QualityAssessmentQuery(IDbConnectionFactory factory, ICurrentUserService currentUser) : base(factory)
    { _currentUser = currentUser; }
    private const string ReportProjection = """
(to_jsonb(t) - 'ReportJson') || jsonb_build_object('Report', t."ReportJson"::jsonb, 'AgriculturalProductCode', p."Code", 'ExpertCode', u."Code", 'ProductName', p."Name", 'ApplicantCode', applicant."Code", 'AgriculturalOrderCode', o."Code")
""";
    private string Projection => QueryAccess.IsManager(_currentUser) || _currentUser.Roles.Contains("Admin")
        ? ReportProjection
        : $"CASE WHEN t.\"ApplicantId\"=@CurrentUserId OR t.\"ExpertId\"=@CurrentUserId OR o.\"BuyerId\"=@CurrentUserId OR o.\"FarmId\" IN (SELECT \"FarmId\" FROM \"Farms\" WHERE \"OwnerId\"=@CurrentUserId) THEN ({ReportProjection}) ELSE ({ReportProjection}) - ARRAY['ApplicantCode','RequestDescription','RequestedQuantity','Fee','DiscountAmount','PaidAmount','PaidAt','ApplicantId','IdempotencyKey','RequestHash'] END";
    private const string From = """
FROM "QualityAssessments" t LEFT JOIN "AgriculturalProducts" p ON p."AgriculturalProductId" = t."AgriculturalProductId" LEFT JOIN "Users" u ON u."UserId" = t."ExpertId" LEFT JOIN "Users" applicant ON applicant."UserId"=t."ApplicantId" LEFT JOIN "AgriculturalOrders" o ON o."AgriculturalOrderId"=t."AgriculturalOrderId"
""";
    private QueryFilter BaseFilter()
    {
        var where = new QueryFilter();
        var id = QueryAccess.UserId(_currentUser);
        where.Parameters.Add("CurrentUserId", id);
        if (!QueryAccess.IsManager(_currentUser) && !_currentUser.Roles.Contains("Admin"))
            where.Add("(t.\"AgriculturalOrderId\" IS NULL AND t.\"QualityGrade\" <> 'PENDING' OR o.\"BuyerId\"=@CurrentUserId OR o.\"FarmId\" IN (SELECT \"FarmId\" FROM \"Farms\" WHERE \"OwnerId\"=@CurrentUserId) OR t.\"ApplicantId\"=@CurrentUserId OR t.\"ExpertId\"=@CurrentUserId)", "CurrentUserId", id);
        return where;
    }
    public Task<QualityAssessmentDto?> GetByCodeAsync(string code)
    {
        var where = BaseFilter(); where.Add("t.\"Code\" = @Code", "Code", code);
        return QueryJsonFirstAsync<QualityAssessmentDto>($"SELECT ({Projection})::text {From} {where.Where}", where.Parameters);
    }
    public Task<PagedResult<QualityAssessmentDto>> GetByFilterAsync(QualityAssessmentFilterDto filter)
    {
        var where = BaseFilter();
        where.Equal("o.\"Code\"", "AgriculturalOrderCode", filter.AgriculturalOrderCode);
        if (filter.AssignedToMe) where.Add("t.\"ExpertId\"=@AssignedExpert", "AssignedExpert", QueryAccess.UserId(_currentUser));
        where.Equal("""
p."Code"
""", "AgriculturalProductCode", filter.AgriculturalProductCode);
        where.Equal("""
u."Code"
""", "ExpertCode", filter.ExpertCode);
        where.Equal("""
t."QualityGrade"
""", "QualityGrade", filter.QualityGrade);
        where.Compare("""
t."SuggestedPrice"
""", ">=", "MinSuggestedPrice", filter.MinSuggestedPrice);
        where.Compare("""
t."SuggestedPrice"
""", "<=", "MaxSuggestedPrice", filter.MaxSuggestedPrice);
        where.Compare("""
t."AssessmentDate"
""", ">=", "StartAssessmentDate", filter.StartAssessmentDate);
        where.Compare("""
t."AssessmentDate"
""", "<=", "EndAssessmentDate", filter.EndAssessmentDate);
        return QueryJsonPagedAsync<QualityAssessmentDto>(Projection, From, where, "t.\"CreatedAt\" DESC, t.\"QualityAssessmentId\" DESC", filter.PageNumber, filter.PageSize);
    }
}
