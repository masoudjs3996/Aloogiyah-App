"use client";
import PersianDateTimeField from "@/design-system/molecules/platform/PersianDateTimeField";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ClipboardDocumentCheckIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { platformApi } from "@/lib/actions/platform";
import {
  useAssessments,
  usePlatformProfile,
} from "@/hooks/queries/usePlatform";
import { useUser } from "@/hooks/queries/useUser";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import type { Assessment, AssessmentInput } from "@/shared/types/platform";
import { dateLabel, money, hasRole, isoDate } from "@/shared/utils/platform";
import ActionBar from "@/design-system/molecules/platform/ActionBar";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import StatusBadge from "@/design-system/atoms/platform/StatusBadge";
import PageHeading from "@/design-system/molecules/platform/PageHeading";
import FormPanel from "@/design-system/molecules/platform/FormPanel";
import QueryState from "@/design-system/molecules/platform/QueryState";
import Pagination from "@/design-system/molecules/platform/Pagination";
import ChatRoomLink from "@/design-system/molecules/platform/ChatRoomLink";
import ProductPicker from "@/design-system/molecules/platform/ProductPicker";
import {
  TextField,
  TextAreaField,
} from "@/design-system/molecules/platform/FormField";
import QualityRequestForm from "@/design-system/molecules/platform/QualityRequestForm";
import {
  buildReport,
  canChatWithExpert,
  qualityGrades,
  reportChoices,
  reportDraft,
  reportRows,
} from "@/shared/utils/quality-report";
import { SelectField } from "@/design-system/molecules/platform/FormField";
import toast from "react-hot-toast";
function ReportForm({
  item,
  defaultProduct,
  done,
}: {
  item?: Assessment;
  defaultProduct: string;
  done: () => void;
}) {
  const profile = usePlatformProfile();
  const [product, setProduct] = useState(
    item?.agriculturalProductCode || defaultProduct,
  );
  const [expert, setExpert] = useState(
    item?.expertCode || profile.data?.user?.code || "",
  );
  const [grade, setGrade] = useState(
    item?.qualityGrade === "PENDING" ? "" : item?.qualityGrade || "",
  );
  const [description, setDescription] = useState(
    item?.qualityGrade === "PENDING" ? "" : item?.qualityDescription || "",
  );
  const [price, setPrice] = useState(String(item?.suggestedPrice ?? ""));
  const [date, setDate] = useState("");
  const [report, setReport] = useState(() => reportDraft(item?.report));
  const mutation = usePlatformMutation(
    async (data: AssessmentInput) =>
      item
        ? platformApi.updateAssessment({ ...data, code: item.code })
        : platformApi.createAssessment(data),
    ["assessments"],
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    let structured;
    let assessmentDate;
    try {
      structured = buildReport(report);
      assessmentDate = date ? isoDate(date) : item?.assessmentDate;
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
      return;
    }
    try {
      await mutation.mutateAsync({
        agriculturalProductCode: product,
        expertCode: expert.trim(),
        qualityDescription: description.trim(),
        qualityGrade: grade.trim(),
        report: structured,
        suggestedPrice: price ? Number(price) : undefined,
        assessmentDate,
      });
      done();
    } catch {
      /* API errors are shown by the mutation hook. */
    }
  }
  return (
    <form className="space-y-5" onSubmit={submit}>
      {!item && <ProductPicker value={product} onChange={setProduct} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="کد کارشناس"
          required
          dir="ltr"
          value={expert}
          readOnly
          onChange={(e) => setExpert(e.target.value)}
        />
        <SelectField
          label="درجه کیفیت"
          required
          value={grade}
          onChange={(event) => setGrade(event.target.value)}
        >
          <option value="">انتخاب درجه کیفیت</option>
          {qualityGrades.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </SelectField>
        <TextField
          label="قیمت پیشنهادی (تومان)"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <PersianDateTimeField
          label="زمان ارزیابی"
          value={date}
          onChange={setDate}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {reportChoices.map((field) => (
          <SelectField
            key={field.key}
            label={field.label}
            required
            value={report[field.key]}
            onChange={(event) =>
              setReport((previous) => ({
                ...previous,
                [field.key]: event.target.value,
              }))
            }
          >
            <option value="">انتخاب کنید</option>
            {field.options.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </SelectField>
        ))}
        <TextField
          label="درصد آسیب"
          type="number"
          min="0"
          max="100"
          step="0.01"
          required
          value={report.damagePercent}
          onChange={(event) =>
            setReport({ ...report, damagePercent: event.target.value })
          }
        />
        <TextField
          label="مقدار بررسی‌شده"
          type="number"
          min="0.001"
          max="100000000"
          step="0.001"
          required
          value={report.inspectedQuantity}
          onChange={(event) =>
            setReport({ ...report, inspectedQuantity: event.target.value })
          }
        />
      </div>
      <TextAreaField
        label="نظر کارشناس"
        required
        maxLength={1000}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <ActionBar>
        <ActionButton
          type="submit"
          disabled={!product || grade.trim() === "PENDING"}
          busy={mutation.isPending}
        >
          ثبت گزارش کارشناسی
        </ActionButton>
      </ActionBar>
    </form>
  );
}
export default function QualityWorkspace({
  initialProduct = "",
  initialOrder = "",
}: {
  initialProduct?: string;
  initialOrder?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [product, setProduct] = useState(initialProduct);
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<"request" | "report" | null>(null);
  const [editing, setEditing] = useState<Assessment>();
  const [assigning, setAssigning] = useState<Assessment>();
  const [expertCode, setExpertCode] = useState("");

  const { roulData } = useUser();
  const role = roulData?.data?.roleName;
  const roles = roulData?.data?.roleNames;

  const profile = usePlatformProfile();
  const expertRole = mounted && hasRole(roles, "Expert", role);
  const query = useAssessments(
    {
      PageNumber: page,
      PageSize: 12,
      AgriculturalProductCode: product || undefined,
      AgriculturalOrderCode: initialOrder || undefined,
      AssignedToMe: expertRole && !initialProduct,
    },
    true,
  );
  const canReport = expertRole;

  const [newFee, setNewFee] = useState("");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading
        title="خرید مطمئن با تعیین کیفیت"
        description="گزارش کارشناسی محصول، درجه کیفیت و قیمت پیشنهادی را بررسی کنید."
        action={
          mounted && !expertRole ? (
            <ActionButton onClick={() => setMode("request")}>
              <PlusIcon className="h-5 w-5" />
              درخواست تعیین کیفیت
            </ActionButton>
          ) : undefined
        }
      />

      {initialProduct && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
          <p>
            {initialOrder
              ? "گزارش کیفیت محصول این سفارش"
              : "گزارش‌ها و درخواست‌های کارشناسی همین محصول"}
          </p>
          <Link
            href={`/product/${encodeURIComponent(initialProduct)}`}
            className="font-bold"
          >
            بازگشت به محصول ←
          </Link>
        </div>
      )}
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => query.refetch()}
        empty={!query.data?.items.length}
        emptyText="هنوز گزارش یا درخواست کارشناسی برای این بخش ثبت نشده است."
        skeleton="cards"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {query.data?.items.map((item) => (
            <article
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              key={item.code}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ClipboardDocumentCheckIcon className="h-8 w-8 text-emerald-600" />
                  <Link
                    href={`/product/${encodeURIComponent(item.agriculturalProductCode)}`}
                    className="text-sm font-bold text-slate-800"
                  >
                    {item.productName || "مشاهده محصول"}
                  </Link>
                </div>
                <StatusBadge
                  tone={item.qualityGrade === "PENDING" ? "amber" : "green"}
                >
                  {item.qualityGrade === "PENDING"
                    ? "در انتظار کارشناسی"
                    : item.qualityGrade}
                </StatusBadge>
              </div>
              {item.requestDescription && (
                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-500">
                    شرح درخواست بازدید
                    {item.requestedQuantity
                      ? ` · ${item.requestedQuantity.toLocaleString("fa-IR")} کیلوگرم`
                      : ""}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    {item.requestDescription}
                  </p>
                </div>
              )}
              {item.paidAt && (
                <p className="mt-3 text-xs text-emerald-700">
                  پرداخت‌شده: {money(item.paidAmount)} ·{" "}
                  {item.expertCode
                    ? "کارشناس تخصیص یافته"
                    : "در انتظار تخصیص کارشناس"}
                </p>
              )}
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {item.qualityDescription}
              </p>
              {item.report && item.qualityGrade !== "PENDING" && (
                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-emerald-50 p-4">
                  {reportRows(item.report).map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-slate-500">{label}</dt>
                      <dd className="mt-1 text-sm font-bold text-emerald-900">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
                <span className="text-slate-400">
                  {dateLabel(item.assessmentDate || item.createdAt)}
                </span>
                {item.suggestedPrice != null && (
                  <strong className="text-emerald-800">
                    قیمت پیشنهادی: {money(item.suggestedPrice)}
                  </strong>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {canReport && item.expertCode === profile.data?.user?.code && (
                  <ActionButton
                    variant="secondary"
                    onClick={() => {
                      setEditing(item);
                      setMode("report");
                    }}
                  >
                    ویرایش / تکمیل گزارش
                  </ActionButton>
                )}
                {canChatWithExpert(item, profile.data?.user?.code) && (
                  <ChatRoomLink
                    receiverCode={item.expertCode!}
                    qualityAssessmentCode={item.code}
                    className="px-3 py-3 text-xs font-bold text-emerald-700"
                  >
                    گفت‌وگو با کارشناس
                  </ChatRoomLink>
                )}
              </div>
            </article>
          ))}
        </div>
        <Pagination
          page={page}
          total={query.data?.totalCount || 0}
          onChange={setPage}
          busy={query.isFetching}
        />
      </QueryState>
      <FormPanel
        open={mode !== null}
        onClose={() => setMode(null)}
        title={mode === "request" ? "درخواست تعیین کیفیت" : "گزارش کارشناسی"}
      >
        {mode === "request" ? (
          <QualityRequestForm
            product={product}
            order={initialOrder}
            done={() => setMode(null)}
          />
        ) : mode === "report" ? (
          <ReportForm
            key={editing?.code || "new"}
            item={editing}
            defaultProduct={product}
            done={() => setMode(null)}
          />
        ) : null}
      </FormPanel>
    </div>
  );
}
