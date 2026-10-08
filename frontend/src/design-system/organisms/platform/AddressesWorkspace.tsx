"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPinIcon, PlusIcon } from "@heroicons/react/24/outline";
import { platformApi } from "@/lib/actions/platform";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import type { Address, AddressInput } from "@/shared/types/platform";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import StatusBadge from "@/design-system/atoms/platform/StatusBadge";
import PageHeading from "@/design-system/molecules/platform/PageHeading";
import FormPanel from "@/design-system/molecules/platform/FormPanel";
import QueryState from "@/design-system/molecules/platform/QueryState";
import Pagination from "@/design-system/molecules/platform/Pagination";
import {
  TextField,
  TextAreaField,
  SelectField,
} from "@/design-system/molecules/platform/FormField";
export function AddressForm({
  item,
  done,
}: {
  item?: Address;
  done: () => void;
}) {
  const [form, setForm] = useState<AddressInput>({
    street: item?.street || "",
    postalCode: item?.postalCode || "",
    provinceCode: item?.provinceCode || "",
    countyCode: item?.countyCode || "",
    cityCode: item?.cityCode || undefined,
    villageCode: item?.villageCode || undefined,
    isDefault: item?.isDefault || false,
  });
  const [place, setPlace] = useState(item?.cityCode || item?.villageCode || "");
  const provinces = useQuery({
    queryKey: ["platform", "provinces"],
    queryFn: platformApi.provinces,
  });
  const counties = useQuery({
    queryKey: ["platform", "counties", form.provinceCode],
    queryFn: () => platformApi.counties(form.provinceCode),
    enabled: !!form.provinceCode,
  });
  const places = useQuery({
    queryKey: ["platform", "places", form.countyCode],
    queryFn: () => platformApi.countyLocations(form.countyCode),
    enabled: !!form.countyCode,
  });
  const mutation = usePlatformMutation(
    async (data: AddressInput) =>
      item
        ? platformApi.updateAddress({ ...data, addressCode: item.code })
        : platformApi.createAddress(data),
    ["addresses"],
  );
  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await mutation.mutateAsync(form);
          done();
        } catch {}
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <QueryState error={provinces.error} retry={() => provinces.refetch()}>
          <SelectField
            label="استان"
            required
            disabled={provinces.isLoading}
            value={form.provinceCode}
            onChange={(e) => {
              setForm((prev) => ({
                ...prev,
                provinceCode: e.target.value,
                countyCode: "",
                cityCode: undefined,
                villageCode: undefined,
              }));
              setPlace("");
            }}
          >
            <option value="">انتخاب استان</option>
            {provinces.data?.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </SelectField>
        </QueryState>
        <QueryState error={counties.error} retry={() => counties.refetch()}>
          <SelectField
            label="شهرستان"
            required
            disabled={!form.provinceCode || counties.isLoading}
            value={form.countyCode}
            onChange={(e) => {
              setForm((prev) => ({
                ...prev,
                countyCode: e.target.value,
                cityCode: undefined,
                villageCode: undefined,
              }));
              setPlace("");
            }}
          >
            <option value="">انتخاب شهرستان</option>
            {counties.data?.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </SelectField>
        </QueryState>
        <QueryState error={places.error} retry={() => places.refetch()}>
          <SelectField
            label="شهر / روستا (اختیاری)"
            disabled={!form.countyCode || places.isLoading}
            value={place}
            onChange={(e) => {
              const code = e.target.value;
              const location = places.data?.find((p) => p.code === code);
              const village = location?.type?.toLowerCase() === "village";
              setPlace(code);
              setForm((prev) => ({
                ...prev,
                cityCode: code && !village ? code : undefined,
                villageCode: code && village ? code : undefined,
              }));
            }}
          >
            <option value="">انتخاب محل</option>
            {places.data?.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name} (
                {p.type?.toLowerCase() === "village" ? "روستا" : "شهر"})
              </option>
            ))}
          </SelectField>
        </QueryState>
        <TextField
          label="کد پستی"
          required
          inputMode="numeric"
          maxLength={20}
          dir="ltr"
          value={form.postalCode}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, postalCode: e.target.value }))
          }
        />
      </div>
      <TextAreaField
        label="نشانی کامل، پلاک و واحد"
        required
        maxLength={500}
        value={form.street}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, street: e.target.value }))
        }
      />
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, isDefault: e.target.checked }))
          }
        />
        آدرس پیش‌فرض
      </label>
      <ActionButton type="submit" busy={mutation.isPending}>
        ذخیره آدرس
      </ActionButton>
    </form>
  );
}
export default function AddressesWorkspace() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<Address>();
  const [deleting, setDeleting] = useState<Address>();
  const query = useQuery({
    queryKey: ["platform", "addresses", page],
    queryFn: () => platformApi.addresses({ PageNumber: page, PageSize: 12 }),
  });
  const remove = usePlatformMutation(
    platformApi.deleteAddress,
    ["addresses"],
    "آدرس حذف شد",
  );
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading
        title="آدرس‌های من"
        description="نشانی‌های ارسال سفارش را مدیریت کنید."
        action={
          <ActionButton
            onClick={() => {
              setItem(undefined);
              setOpen(true);
            }}
          >
            <PlusIcon className="h-5 w-5" />
            آدرس جدید
          </ActionButton>
        }
      />
      <QueryState
        loading={query.isLoading}
        error={query.error}
        empty={!query.data?.items.length}
        retry={() => query.refetch()}
        skeleton="cards"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {query.data?.items.map((address) => (
            <article
              key={address.code}
              className="rounded-2xl border border-slate-100 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <MapPinIcon className="h-7 w-7 text-emerald-600" />
                {address.isDefault && (
                  <StatusBadge tone="green">پیش‌فرض</StatusBadge>
                )}
              </div>
              <h2 className="mb-3 mt-4 font-bold">
                {address.provinceName}، {address.countyName}{" "}
                {address.cityName || address.villageName}
              </h2>
              <p className="mb-4 whitespace-pre-wrap text-sm leading-7 text-slate-500">
                {address.street}
              </p>
              <p className="mb-5 text-xs text-slate-400">
                کد پستی: {address.postalCode}
              </p>
              <div className="flex gap-2">
                <ActionButton
                  variant="secondary"
                  onClick={() => {
                    setItem(address);
                    setOpen(true);
                  }}
                >
                  ویرایش
                </ActionButton>
                <ActionButton
                  variant="danger"
                  onClick={() => setDeleting(address)}
                >
                  حذف
                </ActionButton>
              </div>
            </article>
          ))}
        </div>
      </QueryState>
      <Pagination
        page={page}
        total={query.data?.totalCount || 0}
        onChange={setPage}
      />
      <FormPanel
        open={open}
        onClose={() => setOpen(false)}
        title={item ? "ویرایش آدرس" : "آدرس جدید"}
      >
        {open && <AddressForm item={item} done={() => setOpen(false)} />}
      </FormPanel>
      <FormPanel
        open={!!deleting}
        onClose={() => setDeleting(undefined)}
        title="حذف آدرس"
      >
        <p className="mb-5 text-sm">این آدرس حذف شود؟</p>
        <ActionButton
          variant="danger"
          busy={remove.isPending}
          onClick={async () => {
            if (!deleting) return;
            try {
              await remove.mutateAsync(deleting.code);
              setDeleting(undefined);
            } catch {}
          }}
        >
          تأیید حذف
        </ActionButton>
      </FormPanel>
    </div>
  );
}
