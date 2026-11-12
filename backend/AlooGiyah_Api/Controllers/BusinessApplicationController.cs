using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using AlooGiyah_Application.Legal;
using AlooGiyah_Application.Commons;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Domain.ValueObjects;
using AlooGiyah_Persistence.Context;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Api.Controllers;

[ApiController, Route("api/BusinessApplication"), Authorize(Policy="NotGuest")]
public class BusinessApplicationController(AlooGiyahDbContext db, ICurrentUserService actor, IBusinessDocumentStorage storage, INotificationWriter notifications) : ControllerBase
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private static readonly string[] OpenStatuses = ["Pending", "NeedsInfo", "VisitRequired"];
    private int ActorId => actor.IsAuthenticated && !actor.IsGuest && int.TryParse(actor.UserId, out var id) ? id : throw new UnauthorizedException("ابتدا وارد شوید.");
    private bool IsReviewer => actor.Roles.Any(x=>x is "Admin" or "Manager");
    private IQueryable<BusinessApplication> Query => db.BusinessApplications.Include(x=>x.User).Include(x=>x.TermsAcceptances).Where(x=>!x.IsDeleted && !x.User.IsDeleted);
    private static List<BusinessDocument> Documents(BusinessApplication item) => JsonSerializer.Deserialize<List<BusinessDocument>>(item.DocumentsJson, Json) ?? [];
    private static bool HasRequiredDocuments(IEnumerable<string?> kinds)
    {
        var set = kinds.ToHashSet();
        return set.Contains("Identity") && set.Contains("Premises") && set.Contains("License");
    }
    private static void Event(BusinessApplication item, string action, string? note, string author) {
        var history = JsonSerializer.Deserialize<List<BusinessEvent>>(item.HistoryJson, Json) ?? [];
        history.Add(new(action, note, author, DateTimeOffset.UtcNow));
        item.HistoryJson = JsonSerializer.Serialize(history, Json);
    }
    private static object View(BusinessApplication x) => new {
        x.Code, x.BusinessType, x.BusinessName, x.Description, x.LicenseNumber, x.Status, x.Version, x.CreatedAt, x.UpdatedAt,
        userCode=x.User.Code, applicantName=(x.User.FName+" "+x.User.LName).Trim(), phoneNumber=x.User.PhoneNumber,
        address=JsonSerializer.Deserialize<JsonElement>(x.AddressJson),
        documents=Documents(x).Select(d=>new {d.Code,d.Name,d.ContentType,d.Size,d.Kind}),
        history=JsonSerializer.Deserialize<JsonElement>(x.HistoryJson), x.ReviewNote, x.VisitAt, x.VisitedAt, x.VisitNote,
        termsAcceptance=x.TermsAcceptances.OrderByDescending(a=>a.AcceptedAt).Select(a=>new {a.TermsVersion,a.TermsHash,a.AcceptedAt}).FirstOrDefault(),
        grantedRole=x.Status=="Approved" ? (x.BusinessType=="Farmer" ? "Farmer" : "Buyer") : null
    };
    private IActionResult Result(object data) => Ok(new ApiResponse<object>{ IsSuccess=true, Data=data });

    [HttpGet("My")]
    public async Task<IActionResult> Mine([FromQuery]int pageNumber=1, [FromQuery]int pageSize=12) => await List(false,null,null,null,pageNumber,pageSize);
    [HttpGet("Admin"), Authorize(Roles="Admin,Manager")]
    public async Task<IActionResult> Admin([FromQuery]string? status=null,[FromQuery]string? businessType=null,[FromQuery]string? search=null,[FromQuery]int pageNumber=1,[FromQuery]int pageSize=20) => await List(true,status,businessType,search,pageNumber,pageSize);
    private async Task<IActionResult> List(bool all,string? status,string? type,string? search,int page,int size) {
        var id=ActorId;
        if(page<1 || size<1 || size>100) throw new BadRequestException("صفحه‌بندی معتبر نیست.");
        if(all && !IsReviewer) throw new ForbiddenException("دسترسی بررسی درخواست ندارید.");
        var q=Query.AsNoTracking(); if(!all) q=q.Where(x=>x.UserId==id);
        if(!string.IsNullOrWhiteSpace(status)) q=q.Where(x=>x.Status==status);
        if(!string.IsNullOrWhiteSpace(type)) q=q.Where(x=>x.BusinessType==type);
        if(!string.IsNullOrWhiteSpace(search)) { search=search.Trim(); q=q.Where(x=>x.Code==search || x.BusinessName.Contains(search) || x.User.PhoneNumber.Contains(search) || (x.User.FName+" "+x.User.LName).Contains(search)); }
        var total=await q.CountAsync(); var rows=await q.OrderByDescending(x=>x.CreatedAt).ThenByDescending(x=>x.BusinessApplicationId).Skip((page-1)*size).Take(size).ToListAsync();
        return Result(new{items=rows.Select(View),totalCount=total,pageNumber=page,pageSize=size});
    }
    [HttpGet("{code}")]
    public async Task<IActionResult> Detail(string code) => Result(View(await Accessible(code)));
    private async Task<BusinessApplication> Accessible(string code) {
        var id=ActorId;
        var item=await Query.SingleOrDefaultAsync(x=>x.Code==code) ?? throw new NotFoundException("درخواست یافت نشد.");
        if(item.UserId!=id && !IsReviewer) throw new ForbiddenException("این درخواست متعلق به حساب شما نیست.");
        return item;
    }
    [HttpPost, RequestSizeLimit(52*1024*1024), RequestFormLimits(MultipartBodyLengthLimit=52*1024*1024)]
    public Task<IActionResult> Create([FromForm] BusinessApplicationInput input) => Submit(null,input);
    [HttpPost("{code}/Resubmit"), RequestSizeLimit(52*1024*1024), RequestFormLimits(MultipartBodyLengthLimit=52*1024*1024)]
    public Task<IActionResult> Resubmit(string code,[FromForm]BusinessApplicationInput input) => Submit(code,input);
    private async Task<IActionResult> Submit(string? code, BusinessApplicationInput input) {
        var id=ActorId;
        if(input.BusinessType is not ("Farmer" or "Shop")) throw new BadRequestException("نوع فعالیت معتبر نیست.");
        MarketplaceTerms.Validate(input.AcceptedTerms, input.TermsVersion, input.TermsHash);
        if(string.IsNullOrWhiteSpace(input.BusinessName) || string.IsNullOrWhiteSpace(input.Description)) throw new BadRequestException("نام محل فعالیت و توضیحات الزامی است.");
        var user=await db.Users.Include(x=>x.Role).Include(x=>x.AdditionalRoles).ThenInclude(x=>x.Role).SingleOrDefaultAsync(x=>x.UserId==id && !x.IsDeleted) ?? throw new UnauthorizedException("حساب فعال نیست.");
        var role=input.BusinessType=="Farmer"?"Farmer":"Buyer";
        if((!user.Role.IsDeleted && user.Role.Name==role) || user.AdditionalRoles.Any(x=>!x.IsDeleted && !x.Role.IsDeleted && x.Role.Name==role)) throw new BadRequestException("این دسترسی هم‌اکنون برای حساب شما فعال است.");
        var address=await db.Addresses.AsNoTracking().Where(x=>x.Code==input.AddressCode && x.UserId==id && !x.IsDeleted)
            .Select(x=>new { x.Code, province=x.Province.Name, county=x.County.Name, city=x.City==null?null:x.City.Name, village=x.Village==null?null:x.Village.Name, x.Street,x.PostalCode,x.Latitude,x.Longitude }).SingleOrDefaultAsync()
            ?? throw new BadRequestException("نشانی محل فعالیت را از آدرس‌های حساب خود انتخاب یا ثبت کنید.");
        if(string.IsNullOrWhiteSpace(address.Street)) throw new BadRequestException("نشانی محل فعالیت کامل نیست.");
        BusinessApplication item;
        if(code!=null) {
            item=await Accessible(code);
            if(item.UserId!=id || item.Status!="NeedsInfo") throw new ForbiddenException("فقط درخواست نیازمند تکمیل خودتان قابل اصلاح است.");
            if(input.Version!=item.Version || input.BusinessType!=item.BusinessType) throw new ConflictException("درخواست تغییر کرده است؛ صفحه را به‌روز کنید.");
        } else {
            if(await db.BusinessApplications.AnyAsync(x=>x.UserId==id && x.BusinessType==input.BusinessType && !x.IsDeleted && OpenStatuses.Contains(x.Status))) throw new ConflictException("یک درخواست در حال بررسی دارید؛ همان درخواست را پیگیری کنید.");
            item=new(){UserId=id,User=user,BusinessType=input.BusinessType};
        }
        var docs=Documents(item);
        if(input.RemoveDocumentCodes.Any(c=>!docs.Any(d=>d.Code==c))) throw new BadRequestException("مدرک انتخاب‌شده متعلق به درخواست نیست.");
        var uploads = new (string Kind, IFormFile? File)[]
        {
            ("Identity", input.IdentityDocument), ("Premises", input.PremisesDocument),
            ("License", input.LicenseDocument), ("Membership", input.MembershipDocument)
        };
        var newFiles = uploads.Where(upload => upload.File != null).ToArray();
        var removedDocs = docs.Where(d => input.RemoveDocumentCodes.Contains(d.Code) ||
            newFiles.Any(upload => upload.Kind == d.Kind)).ToList();
        docs = docs.Except(removedDocs).ToList();
        if (!HasRequiredDocuments(docs.Select(d => d.Kind).Concat(newFiles.Select(upload => upload.Kind))))
            throw new BadRequestException("مدرک شناسایی، مدرک محل فعالیت و پروانه را بارگذاری کنید.");
        if (input.Files.Count > 0)
            throw new BadRequestException("نوع هر مدرک را در فرم جدید مشخص کنید.");
        if(docs.Count+newFiles.Length>5) throw new BadRequestException("حداکثر ۵ مدرک مجاز است. در صورت نیاز، مدارک قدیمی را حذف کنید.");
        var saved=new List<ChatStoredFile>();
        try {
            foreach (var upload in newFiles)
            {
                var stored = await storage.SaveAsync(upload.File!);
                saved.Add(stored);
                docs.Add(new(Guid.NewGuid().ToString("N"), stored.Key, stored.Name, stored.ContentType, stored.Size, upload.Kind));
            }
            item.BusinessName=input.BusinessName.Trim();item.Description=input.Description.Trim();item.LicenseNumber=input.LicenseNumber?.Trim();
            item.AddressJson=JsonSerializer.Serialize(address,Json);item.DocumentsJson=JsonSerializer.Serialize(docs,Json);item.Status="Pending";
            item.VisitAt=null;item.VisitedAt=null;item.VisitNote=null;item.ReviewNote=null;item.UpdatedAt=DateTimeOffset.UtcNow;item.Version=Guid.NewGuid();
            Event(item,code==null?"Submitted":"Resubmitted",code==null?"درخواست ثبت شد":"اطلاعات و مدارک تکمیل شد","متقاضی");
            var terms=MarketplaceTerms.Get();
            item.TermsAcceptances.Add(new() { UserId=id, BusinessType=input.BusinessType, TermsVersion=MarketplaceTerms.CurrentVersion,
                TermsHash=terms.Hash, TermsSnapshot=terms.Snapshot, AcceptedAt=DateTimeOffset.UtcNow });
            if(code==null) db.BusinessApplications.Add(item);
            await db.SaveChangesAsync();
        } catch(DbUpdateException) { foreach(var file in saved) storage.Delete(file.Key);throw new ConflictException("درخواست هم‌زمان تغییر کرده یا درخواست باز دیگری دارید؛ صفحه را به‌روز کنید."); }
          catch { foreach(var file in saved) storage.Delete(file.Key);throw; }
        foreach(var document in removedDocs) storage.Delete(document.Key);
        return Result(View(item));
    }
    [HttpGet("{code}/Documents/{documentCode}")]
    public async Task<IActionResult> Download(string code,string documentCode) {
        var item=await Accessible(code);var doc=Documents(item).SingleOrDefault(x=>x.Code==documentCode) ?? throw new NotFoundException("مدرک یافت نشد.");
        Response.Headers["Cache-Control"]="private, no-store";Response.Headers["X-Content-Type-Options"]="nosniff";
        return File(storage.Open(doc.Key),doc.ContentType,doc.Name);
    }
    [HttpPost("{code}/Review"), Authorize(Roles="Admin,Manager")]
    public async Task<IActionResult> Review(string code,BusinessReviewInput input) {
        var id=ActorId;if(!IsReviewer) throw new ForbiddenException("دسترسی بررسی ندارید.");
        await using var transaction=await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var item=await Accessible(code);
        if(item.UserId==id) throw new ForbiddenException("درخواست خودتان را نمی‌توانید بررسی کنید.");
        if(item.Version!=input.Version) throw new ConflictException("نتیجه بررسی تغییر کرده است؛ صفحه را به‌روز کنید.");
        if(!OpenStatuses.Contains(item.Status)) throw new ConflictException("این درخواست قبلاً نهایی شده است.");
        if(input.Action is "Reject" or "RequestInfo" or "RecordVisit" && string.IsNullOrWhiteSpace(input.Note)) throw new BadRequestException("توضیح نتیجه بررسی الزامی است.");
        var label="";
        switch(input.Action) {
            case "Approve":
                if (!HasRequiredDocuments(Documents(item).Select(document => document.Kind)))
                    throw new BadRequestException("مدارک الزامی کامل نیست. ابتدا درخواست تکمیل مدارک ارسال کنید.");
                if(!item.TermsAcceptances.Any(a=>a.UserId==item.UserId && a.BusinessType==item.BusinessType))
                    throw new BadRequestException("پذیرش قوانین برای این درخواست ثبت نشده است؛ ابتدا درخواست تکمیل اطلاعات ارسال کنید.");
                if(item.Status=="NeedsInfo") throw new BadRequestException("منتظر تکمیل اطلاعات متقاضی بمانید.");
                if(item.Status=="VisitRequired" && !item.VisitedAt.HasValue) throw new BadRequestException("ابتدا نتیجه بازدید را ثبت کنید.");
                var targetName=item.BusinessType=="Farmer"?"Farmer":"Buyer";
                var role=await db.Roles.SingleOrDefaultAsync(x=>!x.IsDeleted && x.Name==targetName) ?? throw new BadRequestException("نقش موردنیاز در سامانه تعریف نشده است.");
                var user=await db.Users.Include(x=>x.Role).Include(x=>x.AdditionalRoles).SingleAsync(x=>x.UserId==item.UserId && !x.IsDeleted);
                if(user.Role.Name=="User") user.RoleId=role.RoleId;
                else if(user.RoleId!=role.RoleId) {
                    var assignment=user.AdditionalRoles.SingleOrDefault(x=>x.RoleId==role.RoleId);
                    if(assignment==null) db.UserRoles.Add(new(){UserId=user.UserId,RoleId=role.RoleId});else assignment.IsDeleted=false;
                }
                user.TokenVersion++;user.UpdatedAt=DateTimeOffset.UtcNow;item.Status="Approved";label="درخواست همکاری تأیید شد";break;
            case "Reject": item.Status="Rejected";label="درخواست همکاری رد شد";break;
            case "RequestInfo": item.Status="NeedsInfo";label="نیاز به تکمیل اطلاعات همکاری";break;
            case "ScheduleVisit":
                if(input.VisitAt==null || input.VisitAt<=DateTimeOffset.UtcNow) throw new BadRequestException("تاریخ آینده برای بازدید تعیین کنید.");
                item.Status="VisitRequired";item.VisitAt=input.VisitAt;item.VisitedAt=null;item.VisitNote=null;label="بازدید محل فعالیت برنامه‌ریزی شد";break;
            case "RecordVisit":
                if(item.Status!="VisitRequired") throw new BadRequestException("ابتدا نیاز به بازدید را ثبت کنید.");
                item.VisitedAt=DateTimeOffset.UtcNow;item.VisitNote=input.Note!.Trim();label="نتیجه بازدید محل فعالیت ثبت شد";break;
            default: throw new BadRequestException("عملیات بررسی معتبر نیست.");
        }
        item.ReviewNote=input.Note?.Trim();item.ReviewedById=id;item.ReviewedAt=DateTimeOffset.UtcNow;item.UpdatedAt=DateTimeOffset.UtcNow;item.Version=Guid.NewGuid();
        Event(item,input.Action,input.Note?.Trim(),"مدیریت");
        await notifications.AddForUserAsync(item.UserId,label,label+(string.IsNullOrWhiteSpace(input.Note)?"":"؛ "+input.Note[..Math.Min(input.Note.Length,600)]));
        try { await db.SaveChangesAsync();await transaction.CommitAsync(); }
        catch(DbUpdateException) { throw new ConflictException("درخواست هم‌زمان تغییر کرده است؛ صفحه را به‌روز کنید."); }
        return Result(View(item));
    }
}
public class BusinessApplicationInput {
    public bool AcceptedTerms {get;set;}
    [MaxLength(40)] public string? TermsVersion {get;set;}
    [MaxLength(64)] public string? TermsHash {get;set;}
    [Required,MaxLength(20)] public string BusinessType {get;set;}="Farmer";
    [Required,MaxLength(150)] public string BusinessName {get;set;}="";
    [Required,MaxLength(3000)] public string Description {get;set;}="";
    [Required,MaxLength(10)] public string AddressCode {get;set;}="";
    [MaxLength(100)] public string? LicenseNumber {get;set;}
    public Guid? Version {get;set;}
    public List<string> RemoveDocumentCodes {get;set;}=[];
    public List<IFormFile> Files {get;set;}=[];
    public IFormFile? IdentityDocument { get; set; }
    public IFormFile? PremisesDocument { get; set; }
    public IFormFile? LicenseDocument { get; set; }
    public IFormFile? MembershipDocument { get; set; }
}
public class BusinessReviewInput {
    [Required] public Guid Version {get;set;}
    [Required] public string Action {get;set;}="";
    [MaxLength(2000)] public string? Note {get;set;}
    public DateTimeOffset? VisitAt {get;set;}
}
public record BusinessDocument(string Code,string Key,string Name,string ContentType,long Size,string? Kind = null);
public record BusinessEvent(string Action,string? Note,string Author,DateTimeOffset At);
