export type BusinessType = "Farmer" | "Shop";
export const businessDocumentKinds = ["Identity", "Premises", "License", "Membership"] as const;
export type BusinessDocumentKind = typeof businessDocumentKinds[number];
export function businessDocumentLabel(kind: BusinessDocumentKind | null | undefined, type: BusinessType): string {
  switch (kind) {
    case "Identity": return "مدرک شناسایی (کارت ملی یا شناسنامه)";
    case "Premises": return type === "Farmer" ? "سند، قولنامه یا اجاره‌نامهٔ زمین" : "سند، قولنامه یا اجاره‌نامهٔ مغازه";
    case "License": return type === "Farmer" ? "پروانهٔ بهره‌برداری" : "پروانهٔ کسب";
    case "Membership": return "کارت عضویت در اداره، اتحادیه یا انجمن";
    default: return "مدرک قدیمی";
  }
}
export type BusinessStatus =
  "Pending" | "NeedsInfo" | "VisitRequired" | "Approved" | "Rejected";
export interface BusinessDocument {
  code: string;
  name: string;
  contentType: string;
  size: number;
  kind?: BusinessDocumentKind | null;
}
export interface BusinessApplication {
  code: string;
  businessType: BusinessType;
  businessName: string;
  description: string;
  licenseNumber?: string;
  status: BusinessStatus;
  version: string;
  createdAt: string;
  updatedAt?: string;
  userCode: string;
  applicantName: string;
  phoneNumber: string;
  address: {
    code: string;
    province: string;
    county: string;
    city?: string;
    village?: string;
    street: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
  };
  documents: BusinessDocument[];
  history: { action: string; note?: string; author: string; at: string }[];
  reviewNote?: string;
  visitAt?: string;
  visitedAt?: string;
  visitNote?: string;
  grantedRole?: string;
  termsAcceptance?: { termsVersion: string; termsHash: string; acceptedAt: string } | null;
}
export const businessStatuses: Record<BusinessStatus, string> = {
  Pending: "در حال بررسی",
  NeedsInfo: "نیاز به تکمیل اطلاعات",
  VisitRequired: "نیاز به بازدید",
  Approved: "تأیید شده",
  Rejected: "رد شده",
};
export const businessTypes: Record<BusinessType, string> = {
  Farmer: "کشاورز / فروشنده",
  Shop: "مغازه‌دار / خریدار همکار",
};
export const businessActions: Record<string, string> = {
  Submitted: "ثبت درخواست",
  Resubmitted: "ارسال اطلاعات تکمیلی",
  Approve: "تأیید درخواست",
  Reject: "رد درخواست",
  RequestInfo: "درخواست تکمیل اطلاعات",
  ScheduleVisit: "برنامه‌ریزی بازدید",
  RecordVisit: "ثبت نتیجه بازدید",
};
