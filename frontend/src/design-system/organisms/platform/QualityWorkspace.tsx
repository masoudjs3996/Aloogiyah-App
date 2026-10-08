"use client";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ClipboardDocumentCheckIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { platformApi, request } from "@/lib/actions/platform";
import {
  useAssessments,
  usePlatformProfile,
} from "@/hooks/queries/usePlatform";
import { useUser } from "@/hooks/queries/useUser";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import type { Assessment, AssessmentInput } from "@/shared/types/platform";
import { dateLabel, money, hasManagerRole, hasRole, isoDate } from "@/shared/utils/platform";
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
const requestEnabled =
  process.env.NEXT_PUBLIC_QUALITY_REQUEST_ENABLED === "true";
function RequestForm({ product, done }: { product: string; done: () => void }) {
  const [code, setCode] = useState(product);
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  // این مسیر در patch اختیاری بک‌اند تعریف شده است؛ بدون نصب patch فعال نمی‌شود.
  const mutation = usePlatformMutation(
    (data: {
      agriculturalProductCode: string;
      quantity: number;
      requestDescription: string;
    }) =>
      request<Assessment>("/QualityAssessment/Request", {
        method: "POST",
        data,
      }),
    ["assessments"],
  );
  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await mutation.mutateAsync({
            agriculturalProductCode: code,
            quantity: Number(quantity),
            requestDescription: description.trim(),
          });
          done();
        } catch {}
      }}
    >
      <ProductPicker value={code} onChange={setCode} />
      <TextField
        label="مقدار خرید موردنظر (کیلوگرم)"
        type="number"
        min="0.01"
        step="0.01"
        required
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      <TextAreaField
        label="شرح درخواست"
        required
        maxLength={700}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="مثلاً بررسی کیفیت ۱۰۰ کیلو سیب قبل از خرید"
      />
      <ActionButton type="submit" disabled={!code} busy={mutation.isPending}>
        ثبت درخواست تعیین کیفیت
      </ActionButton>
    </form>
  );
}
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
  const mutation = usePlatformMutation(
    async (data: AssessmentInput) =>
      item
        ? platformApi.updateAssessment({ ...data, code: item.code })
        : platformApi.createAssessment(data),
    ["assessments"],
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await mutation.mutateAsync({
        agriculturalProductCode: product,
        expertCode: expert.trim(),
        qualityDescription: description.trim(),
        qualityGrade: grade.trim(),
        suggestedPrice: price ? Number(price) : undefined,
        assessmentDate: date ? isoDate(date) : item?.assessmentDate,
      });
      done();
    } catch {}
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
          onChange={(e) => setExpert(e.target.value)}
        />
        <TextField
          label="درجه کیفیت"
          required
          maxLength={50}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder="مثلاً درجه یک"
        />
        <TextField
          label="قیمت پیشنهادی (تومان)"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <TextField
          label="زمان ارزیابی"
          type="datetime-local"
          dir="ltr"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <TextAreaField
        label="نظر کارشناس"
        required
        maxLength={1000}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <ActionButton
        type="submit"
        disabled={!product || grade.trim() === "PENDING"}
        busy={mutation.isPending}
      >
        ثبت گزارش کارشناسی
      </ActionButton>
    </form>
  );
}
export default function QualityWorkspace({
  initialProduct = "",
}: {
  initialProduct?: string;
}) {
  const [product, setProduct] = useState(initialProduct);
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<"request" | "report" | null>(null);
  const [editing, setEditing] = useState<Assessment>();
  const [assigning, setAssigning] = useState<Assessment>();
  const [expertCode, setExpertCode] = useState("");
  const assign = usePlatformMutation(platformApi.assignExpert, ["assessments"]);
  const { roulData } = useUser();
  const role = roulData?.data?.roleName;
  const roles = roulData?.data?.roleNames;
  const manager = hasManagerRole(roles, role);
  const profile = usePlatformProfile();
  const expertRole = hasRole(roles, "Expert", role);
  const query = useAssessments(
    {
      PageNumber: page,
      PageSize: 12,
      AgriculturalProductCode: product || undefined,
    },
    !!product || manager || requestEnabled,
  );
  const canReport = manager || expertRole;
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading
        title="خرید مطمئن با تعیین کیفیت"
        description="گزارش کارشناسی محصول، درجه کیفیت و قیمت پیشنهادی را بررسی کنید."
        action={
          <div className="flex flex-wrap gap-2">
            {requestEnabled && (
              <ActionButton onClick={() => setMode("request")}>
                <PlusIcon className="h-5 w-5" />
                درخواست تعیین کیفیت
              </ActionButton>
            )}
            {canReport && (
              <ActionButton
                variant="secondary"
                onClick={() => {
                  setEditing(undefined);
                  setMode("report");
                }}
              >
                ثبت گزارش
              </ActionButton>
            )}
          </div>
        }
      />
      <div className="mb-6 max-w-lg rounded-2xl border border-slate-100 bg-white p-5">
        <ProductPicker
          value={product}
          onChange={(code) => {
            setProduct(code);
            setPage(1);
          }}
        />
      </div>
      {!requestEnabled && (
        <div className="mb-6 rounded-2xl bg-emerald-50 p-5 text-sm leading-7 text-emerald-800">
          گزارش‌های ثبت‌شده برای محصول انتخابی قابل مشاهده‌اند. ثبت درخواست
          کارشناسی توسط خریدار به‌زودی فعال می‌شود.
        </div>
      )}
      {!product && !manager && !requestEnabled ? (
        <QueryState
          empty
          emptyText="برای مشاهده گزارش‌های کیفیت، محصول را انتخاب کنید"
        />
      ) : (
        <QueryState
          loading={query.isLoading}
          error={query.error}
          retry={() => query.refetch()}
          empty={!query.data?.items.length}
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
                      مشاهده محصول
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
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {item.qualityDescription}
                </p>
                <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-400">
                    {dateLabel(item.assessmentDate || item.createdAt)}
                  </span>
                  <strong className="text-emerald-800">
                    {money(item.suggestedPrice)}
                  </strong>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {manager && (
                    <ActionButton
                      variant="secondary"
                      onClick={() => {
                        setAssigning(item);
                        setExpertCode(item.expertCode || "");
                      }}
                    >
                      تخصیص کارشناس
                    </ActionButton>
                  )}
                  {(manager ||
                    (canReport &&
                      item.expertCode === profile.data?.user?.code)) && (
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
                  {item.expertCode && (
                    <ChatRoomLink
                      receiverCode={item.expertCode}
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
      )}
      <FormPanel
        open={mode !== null}
        onClose={() => setMode(null)}
        title={mode === "request" ? "درخواست تعیین کیفیت" : "گزارش کارشناسی"}
      >
        {mode === "request" ? (
          <RequestForm product={product} done={() => setMode(null)} />
        ) : mode === "report" ? (
          <ReportForm
            key={editing?.code || "new"}
            item={editing}
            defaultProduct={product}
            done={() => setMode(null)}
          />
        ) : null}
      </FormPanel>
      <FormPanel
        open={!!assigning}
        onClose={() => setAssigning(undefined)}
        busy={assign.isPending}
        title="تخصیص کارشناس"
      >
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!assigning) return;
            try {
              await assign.mutateAsync({
                code: assigning.code,
                expertCode: expertCode.trim(),
              });
              setAssigning(undefined);
            } catch {}
          }}
        >
          <TextField
            label="کد کارشناس"
            required
            value={expertCode}
            onChange={(e) => setExpertCode(e.target.value)}
            dir="ltr"
          />
          <ActionButton type="submit" busy={assign.isPending}>
            تخصیص کارشناس
          </ActionButton>
        </form>
      </FormPanel>
    </div>
  );
}
