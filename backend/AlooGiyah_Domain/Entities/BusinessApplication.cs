using System.ComponentModel.DataAnnotations;
using AlooGiyah_Domain.Entities.UserFolder;
namespace AlooGiyah_Domain.Entities;
public class BusinessApplication : BaseEntity {
 public int BusinessApplicationId {get;set;}
 public int UserId {get;set;} public User User {get;set;}=null!;
 [MaxLength(20)] public string BusinessType {get;set;}="Farmer";
 [MaxLength(150)] public string BusinessName {get;set;}="";
 [MaxLength(3000)] public string Description {get;set;}="";
 [MaxLength(100)] public string? LicenseNumber {get;set;}
 [MaxLength(20)] public string Status {get;set;}="Pending";
 public string AddressJson {get;set;}="{}";
 public string DocumentsJson {get;set;}="[]";
 public string HistoryJson {get;set;}="[]";
 [MaxLength(2000)] public string? ReviewNote {get;set;}
 public int? ReviewedById {get;set;} public DateTimeOffset? ReviewedAt {get;set;}
 public DateTimeOffset? VisitAt {get;set;} public DateTimeOffset? VisitedAt {get;set;}
 [MaxLength(2000)] public string? VisitNote {get;set;}
 public Guid Version {get;set;}=Guid.NewGuid();
 public List<BusinessTermsAcceptance> TermsAcceptances {get;set;}=new();
}
