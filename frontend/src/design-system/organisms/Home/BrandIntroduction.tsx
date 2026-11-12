"use client";

import { useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePlatformProfile } from "@/hooks/queries/usePlatform";
import { getUserRoul } from "@/lib/actions/user";
import { brandMessages, getBrandAudience, type BrandAudience } from "@/shared/utils/brand-audience";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export default function BrandIntroduction() {
  // Cached profile data must not change the first hydration render.
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const profile = usePlatformProfile();
  const signedIn = hydrated && !!profile.data?.user && !profile.data.isGuest && !profile.isError;
  const roleQuery = useQuery({
    queryKey: ["current-user-commerce-role"],
    queryFn: getUserRoul,
    enabled: signedIn,
    staleTime: 60_000,
    retry: false,
  });
  const roleData = roleQuery.data?.data;
  const roles = signedIn && !roleQuery.isError
    ? roleData?.roleNames?.length ? roleData.roleNames : [roleData?.roleName ?? profile.data?.user?.roleName ?? ""]
    : [];
  const [choice, setChoice] = useState<BrandAudience | null>(null);
  const audience = choice ?? getBrandAudience(roles);
  const message = brandMessages[audience];
  const isFarmer = signedIn && roles.includes("Farmer");
  const farmerHref = isFarmer ? "/dashboard/farm/myFarms" : "/dashboard/business?type=Farmer";
  return (
    <section className="brand-introduction" aria-labelledby="brand-title">
      <div className="container-custom py-5 sm:py-7">
        <div className="flex items-center">
          <div className="w-full">
            <p className="mb-3 text-xs font-semibold text-primary-600">الو گیاه · میدان بار مجازی گل و گیاه</p>
            <div role="group" aria-label="پیام متناسب با مسیر شما" className="mb-3 flex flex-wrap gap-2">
              {([{ value: "farmer", label: "کشاورزم / تولیدکننده‌ام" }, { value: "buyer", label: "برای خرید آمده‌ام" }] as const).map(({ value, label }) => (
                <button key={value} type="button" aria-pressed={audience === value} onClick={() => setChoice(value)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${audience === value ? "border-primary-200 bg-primary-100 text-primary-900" : "border-primary-100 text-primary-600 hover:bg-primary-50"}`}>{label}</button>
              ))}
            </div>
            <div aria-live="polite" aria-atomic="true">
              <h1 id="brand-title" className="text-xl font-bold leading-relaxed sm:text-2xl sm:leading-relaxed">{message.title[0]}{" "}{message.title[1]}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-primary-600">{message.description}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={audience === "farmer" ? farmerHref : message.href} className="brand-main-action">{audience === "farmer" && !isFarmer ? "شروع همکاری به‌عنوان تولیدکننده" : message.action} <ArrowLeftIcon aria-hidden="true" className="h-4 w-4" /></Link>
              <Link href={message.secondaryHref} className="brand-secondary-action">{message.secondary}</Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
