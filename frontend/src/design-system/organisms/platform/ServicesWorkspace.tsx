"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import {
  useServiceRequests,
  usePlatformProfile,
} from "@/hooks/queries/usePlatform";
import { useUser } from "@/hooks/queries/useUser";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import { platformApi } from "@/lib/actions/platform";
import type { ServiceRequest, ServiceInput } from "@/shared/types/platform";
import {
  dateLabel,
  money,
  serviceLabel,
  serviceStatusLabel,
  hasManagerRole,
  hasRole,
  isoDate,
} from "@/shared/utils/platform";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import StatusBadge from "@/design-system/atoms/platform/StatusBadge";
import PageHeading from "@/design-system/molecules/platform/PageHeading";
import ChatRoomLink from "@/design-system/molecules/platform/ChatRoomLink";
import FormPanel from "@/design-system/molecules/platform/FormPanel";
import QueryState from "@/design-system/molecules/platform/QueryState";
import Pagination from "@/design-system/molecules/platform/Pagination";
import {
  SelectField,
  TextField,
  TextAreaField,
} from "@/design-system/molecules/platform/FormField";
import toast from "react-hot-toast";

function ServiceForm({
  item,
  onDone,
}: {
  item?: ServiceRequest;
  onDone: () => void;
}) {
  const [type, setType] = useState(
    { Vase: 0, Garden: 1, Greenhouse: 2 }[
      String(item?.serviceType) as "Vase" | "Garden" | "Greenhouse"
    ] ?? Number(item?.serviceType ?? 0),
  );
  const [description, setDescription] = useState(item?.description || "");
  const [amount, setAmount] = useState(
    String(
      item?.numberOfVases ?? item?.gardenArea ?? item?.greenhouseArea ?? "",
    ),
  );
  const [date, setDate] = useState("");
  const [address, setAddress] = useState("");
  const addressQuery = useQuery({ queryKey: ["addresses", "service-request"], queryFn: () => platformApi.addresses({ PageSize: 50 }), enabled: !item });
  useEffect(() => {
    if (!address && addressQuery.data?.items.length) {
      const preferred = addressQuery.data.items.find((entry) => entry.isDefault) || addressQuery.data.items[0];
      setAddress(preferred.code);
    }
  }, [address, addressQuery.data]);
  const mutation = usePlatformMutation(
    async (input: ServiceInput) =>
      item
        ? platformApi.updateService({ ...input, code: item.code })
        : platformApi.createService(input),
    ["services"],
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    const number = Number(amount);
    if (
      !Number.isFinite(number) ||
      number <= 0 ||
      (type === 0 && !Number.isInteger(number))
    )
      return toast.error("تعداد یا مساحت را درست وارد کنید");
    try {
      if (!description.trim() || (!item && !address))
        return toast.error("شرح درخواست و نشانی مراجعه را انتخاب کنید");
      const payload: ServiceInput = {
        serviceType: type,
        ...(!item ? { addressCode: address } : {}),
        description: description.trim(),
        serviceDate: date ? isoDate(date) : item?.serviceDate,
        ...(type === 0
          ? { numberOfVases: number }
          : type === 1
            ? { gardenArea: number }
            : { greenhouseArea: number }),
      };
      await mutation.mutateAsync(payload);
      onDone();
    } catch {
      /* خطای API در hook نمایش داده می‌شود. */
    }
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="نوع خدمت"
          value={type}
          disabled={!!item}
          onChange={(e) => {
            setType(Number(e.target.value));
            setAmount("");
          }}
        >
          <option value={0}>رسیدگی به گلدان</option>
          <option value={1}>رسیدگی به باغچه</option>
          <option value={2}>رسیدگی به گلخانه</option>
        </SelectField>
        <TextField
          label={type === 0 ? "تعداد گلدان" : "مساحت (متر مربع)"}
          type="number"
          min={type === 0 ? 1 : 0.01}
          step={type === 0 ? 1 : 0.01}
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <TextField
          label="زمان پیشنهادی مراجعه"
          type="datetime-local"
          dir="ltr"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          hint={
            item?.serviceDate
              ? `زمان فعلی: ${dateLabel(item.serviceDate)}؛ خالی بگذارید تا حفظ شود`
              : "زمان نهایی با کارشناس هماهنگ می‌شود"
          }
        />
      </div>
      <TextAreaField
        label="شرح مشکل و خدمات موردنیاز"
        required
        maxLength={item ? 1000 : 800}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="مثلاً برگ‌ها زرد شده‌اند و به تعویض خاک نیاز دارم"
      />
      {!item && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <SelectField label="نشانی مراجعه" required value={address} disabled={addressQuery.isLoading || !addressQuery.data?.items.length} onChange={(e) => setAddress(e.target.value)}>
            <option value="">{addressQuery.isLoading ? "در حال دریافت نشانی‌ها…" : "انتخاب نشانی ذخیره‌شده"}</option>
            {addressQuery.data?.items.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {[entry.provinceName, entry.countyName, entry.cityName || entry.villageName, entry.street].filter(Boolean).join("، ")}{entry.isDefault ? " (پیش‌فرض)" : ""}
              </option>
            ))}
          </SelectField>
          {!addressQuery.isLoading && !addressQuery.isError && !addressQuery.data?.items.length && (
            <p className="mt-3 text-sm leading-6 text-amber-800">هنوز نشانی‌ای ذخیره نکرده‌اید. ابتدا از بخش <Link className="font-bold underline" href="/dashboard/addresses">نشانی‌ها</Link> یک نشانی ثبت کنید.</p>
          )}
          {addressQuery.isError && (
            <p role="alert" className="mt-3 text-sm leading-6 text-red-700">
              دریافت نشانی‌ها ممکن نشد. <button type="button" className="font-bold underline" onClick={() => addressQuery.refetch()}>دوباره تلاش کنید</button>
            </p>
          )}
        </div>
      )}
      <ActionButton
        type="submit"
        busy={mutation.isPending}
        disabled={!item && (addressQuery.isLoading || !address || !addressQuery.data?.items.length)}
      >
        ثبت درخواست
      </ActionButton>
    </form>
  );
}
function ServiceManagement({
  item,
  canAssign,
  onDone,
}: {
  item: ServiceRequest;
  canAssign: boolean;
  onDone: () => void;
}) {
  const [providerCode, setProvider] = useState(item.providerCode || "");
  const [statusCode, setStatus] = useState(item.statusCode);
  const mutation = usePlatformMutation(platformApi.updateService, ["services"]);
  let statusOptions: Record<string, string> = {};
  try {
    const labels = JSON.parse(process.env.NEXT_PUBLIC_SERVICE_STATUS_LABELS || "{}");
    if (labels && typeof labels === "object" && !Array.isArray(labels))
      statusOptions = Object.fromEntries(Object.entries(labels).filter(([, label]) => typeof label === "string")) as Record<string, string>;
  } catch {}
  statusOptions[item.statusCode] ||= serviceStatusLabel(item.statusCode);
  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await mutation.mutateAsync(canAssign ? {
            code: item.code,
            providerCode: providerCode || undefined,
            statusCode,
          } : { code: item.code, statusCode });
          onDone();
        } catch {}
      }}
    >
      {canAssign && <TextField
        label="کد ارائه‌دهنده خدمات"
        value={providerCode}
        onChange={(e) => setProvider(e.target.value)}
        dir="ltr"
      />}
      <SelectField
        label="وضعیت درخواست"
        value={statusCode}
        onChange={(e) => setStatus(e.target.value)}
        required
      >
        {Object.entries(statusOptions).map(([code, label]) => (
          <option key={code} value={code}>{label}</option>
        ))}
      </SelectField>
      <ActionButton type="submit" busy={mutation.isPending}>
        ذخیره تغییرات
      </ActionButton>
    </form>
  );
}
export default function ServicesWorkspace() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRequest>();
  const [managing, setManaging] = useState<ServiceRequest>();
  const query = useServiceRequests({
    PageNumber: page,
    PageSize: 12,
    ServiceType: type || undefined,
  });
  const { roulData } = useUser();
  const profile = usePlatformProfile();
  const role = roulData?.data?.roleName;
  const roles = roulData?.data?.roleNames;
  const manager = hasManagerRole(roles, role);
  const provider = hasRole(roles, "Provider", role);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading
        title="کارشناس گیاه، در کنار شما"
        description="برای رسیدگی به گلدان، باغچه یا گلخانه درخواست بدهید و روند انجام خدمت را پیگیری کنید."
        action={
          <ActionButton
            onClick={() => {
              setEditing(undefined);
              setOpen(true);
            }}
          >
            <PlusIcon className="h-5 w-5" />
            درخواست جدید
          </ActionButton>
        }
      />
      <div className="mb-6 max-w-xs">
        <SelectField
          label="نوع خدمت"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">همه خدمات</option>
          <option value="0">گلدان</option>
          <option value="1">باغچه</option>
          <option value="2">گلخانه</option>
        </SelectField>
      </div>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        empty={!query.data?.items.length}
        retry={() => query.refetch()}
        emptyText="هنوز درخواست خدماتی ثبت نشده است"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {query.data?.items.map((item) => (
            <article
              key={item.code}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                    <WrenchScrewdriverIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">
                      {serviceLabel(item.serviceType)}
                    </h2>
                    <p
                      dir="ltr"
                      className="mt-1 text-right text-xs text-slate-400"
                    >
                      {item.code}
                    </p>
                  </div>
                </div>
                <StatusBadge>{serviceStatusLabel(item.statusCode)}</StatusBadge>
              </div>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                {item.description}
              </p>
              {(item.addressStreet || item.addressCounty) && (
                <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                  <span className="font-bold">نشانی مراجعه: </span>
                  {[item.addressProvince, item.addressCounty, item.addressCity, item.addressStreet].filter(Boolean).join("، ")}
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <CalendarDaysIcon className="h-4 w-4" />
                  {dateLabel(item.serviceDate)}
                </span>
                <strong className="text-emerald-800">
                  {money(item.price)}
                </strong>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.userCode === profile.data?.user?.code && !item.providerCode && (
                  <ActionButton
                    variant="secondary"
                    onClick={() => {
                      setEditing(item);
                      setOpen(true);
                    }}
                  >
                    ویرایش درخواست
                  </ActionButton>
                )}
                {(manager || (provider && item.providerCode === profile.data?.user?.code)) && (
                  <ActionButton
                    variant="secondary"
                    onClick={() => setManaging(item)}
                  >
                    {manager ? "تخصیص ارائه‌دهنده و وضعیت" : "به‌روزرسانی وضعیت خدمت"}
                  </ActionButton>
                )}
                {item.providerCode && (
                  <ChatRoomLink
                    receiverCode={item.providerCode === profile.data?.user?.code ? item.userCode : item.providerCode}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    {item.providerCode === profile.data?.user?.code ? "گفت‌وگو با درخواست‌کننده" : "گفت‌وگو با کارشناس"}
                  </ChatRoomLink>
                )}
              </div>
            </article>
          ))}
        </div>
      </QueryState>
      <Pagination
        page={page}
        total={query.data?.totalCount || 0}
        onChange={setPage}
        busy={query.isFetching}
      />
      <FormPanel
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "ویرایش درخواست" : "درخواست رسیدگی"}
      >
        {open && (
          <ServiceForm
            key={editing?.code || "new"}
            item={editing}
            onDone={() => setOpen(false)}
          />
        )}
      </FormPanel>
      <FormPanel
        open={!!managing}
        onClose={() => setManaging(undefined)}
        title="مدیریت درخواست"
      >
        {managing && (
          <ServiceManagement
            item={managing}
            canAssign={manager}
            onDone={() => setManaging(undefined)}
          />
        )}
      </FormPanel>
    </div>
  );
}
