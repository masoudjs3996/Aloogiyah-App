export type QualityReport = {
  result: string;
  health: string;
  freshness: string;
  uniformity: string;
  damagePercent: number;
  inspectedQuantity: number;
  quantityUnit: string;
};
export const qualityGrades = [
  "ممتاز",
  "درجه یک",
  "درجه دو",
  "درجه سه",
  "غیرقابل عرضه",
];
export const reportChoices = [
  {
    key: "result",
    label: "نتیجه بازدید",
    options: ["تأیید", "تأیید مشروط", "عدم تأیید"],
  },
  {
    key: "health",
    label: "سلامت محصول",
    options: ["سالم", "نیازمند رسیدگی", "آسیب‌دیده", "قابل ارزیابی نیست"],
  },
  {
    key: "freshness",
    label: "تازگی محصول",
    options: ["تازه", "متوسط", "کاهش تازگی", "قابل ارزیابی نیست"],
  },
  {
    key: "uniformity",
    label: "یکنواختی محصول",
    options: ["یکنواخت", "نسبتاً یکنواخت", "ناهمگون", "قابل ارزیابی نیست"],
  },
  {
    key: "quantityUnit",
    label: "واحد مقدار بررسی‌شده",
    options: ["کیلوگرم", "شاخه", "عدد", "بسته", "لیتر"],
  },
] as const;
export type ReportChoice = (typeof reportChoices)[number]["key"];
export type ReportDraft = Record<ReportChoice, string> & {
  damagePercent: string;
  inspectedQuantity: string;
};
export function reportDraft(report?: QualityReport): ReportDraft {
  return {
    result: report?.result || "",
    health: report?.health || "",
    freshness: report?.freshness || "",
    uniformity: report?.uniformity || "",
    quantityUnit: report?.quantityUnit || "",
    damagePercent: report ? String(report.damagePercent) : "",
    inspectedQuantity: report ? String(report.inspectedQuantity) : "",
  };
}
const numeric = (value: string) =>
  Number(
    value
      .replace(/٫/g, ".")
      .replace(/٬/g, "")
      .replace(/[۰-۹٠-٩]/g, (d) =>
        String(
          "۰۱۲۳۴۵۶۷۸۹".includes(d)
            ? "۰۱۲۳۴۵۶۷۸۹".indexOf(d)
            : "٠١٢٣٤٥٦٧٨٩".indexOf(d),
        ),
      ),
  );
export function buildReport(draft: ReportDraft): QualityReport {
  for (const field of reportChoices)
    if (!(field.options as readonly string[]).includes(draft[field.key]))
      throw new Error(`${field.label} را انتخاب کنید`);
  const damagePercent = numeric(draft.damagePercent),
    inspectedQuantity = numeric(draft.inspectedQuantity);
  if (
    !draft.damagePercent.trim() ||
    !Number.isFinite(damagePercent) ||
    damagePercent < 0 ||
    damagePercent > 100
  )
    throw new Error("درصد آسیب باید بین صفر و صد باشد");
  if (
    !draft.inspectedQuantity.trim() ||
    !Number.isFinite(inspectedQuantity) ||
    inspectedQuantity < 0.001 ||
    inspectedQuantity > 100000000
  )
    throw new Error("مقدار بررسی‌شده باید عددی مثبت باشد");
  return { ...draft, damagePercent, inspectedQuantity };
}
export function reportRows(report: QualityReport) {
  const number = (value: number) =>
    new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 3 }).format(value);
  return [
    ...reportChoices
      .filter((f) => f.key !== "quantityUnit")
      .map((f) => [f.label, report[f.key]]),
    ["درصد آسیب", `${number(report.damagePercent)}٪`],
    [
      "مقدار بررسی‌شده",
      `${number(report.inspectedQuantity)} ${report.quantityUnit}`,
    ],
  ];
}

export function canChatWithExpert(item: { applicantCode?: string; expertCode?: string }, userCode?: string) {
  return !!userCode && !!item.expertCode && item.applicantCode === userCode && item.expertCode !== userCode;
}
