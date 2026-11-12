"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiArrowLeft, FiBell, FiMap, FiUser } from "react-icons/fi";
import { usePlatformProfile } from "@/hooks/queries/usePlatform";
import { useUser } from "@/hooks/queries/useUser";
import { dashboardMenuForRoles } from "@/shared/constants/dashboard-menu";
const commerceMode = process.env.NEXT_PUBLIC_MARKETPLACE_MODE === "Commerce";
const groups = [
  {
    title: "آگهی و هماهنگی",
    tone: "bg-emerald-50 text-emerald-700",
    paths: [
      "/dashboard/inquiries",
      "/dashboard/saved",
      "/dashboard/chat",
      "/farm",
    ],
  },
  ...(commerceMode ? [{
    title: "خرید و سفارش",
    tone: "bg-emerald-50 text-emerald-700",
    paths: ["/dashboard/orders", "/dashboard/deliveries", "/dashboard/profile/wallet", "/dashboard/profile/rewards"],
  }] : []),
  {
    title: "مزرعه‌های من",
    tone: "bg-amber-50 text-amber-700",
    paths: [
      ...(commerceMode ? ["/dashboard/sales"] : []),
      "/dashboard/farm/myFarms",
      "/dashboard/farm/registerFarm",
    ],
  },
  {
    title: "حساب من",
    tone: "bg-violet-50 text-violet-700",
    paths: [
      "/dashboard/profile",
      ...(commerceMode ? ["/dashboard/profile/settlements"] : []),
      "/dashboard/profile/notifications",
      "/dashboard/business",
    ],
  },
];
export default function DashboardOverview() {
  const profile = usePlatformProfile();
  const { roulData } = useUser();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const roles = !hydrated
    ? ["User"]
    : roulData?.data?.roleNames?.length
      ? roulData.data.roleNames
      : [roulData?.data?.roleName || profile.data?.user?.roleName || "User"];
  const items = [
    ...dashboardMenuForRoles(roles),
    { path: "/farm", label: "مزارع", icon: FiMap },
    {
      path: "/dashboard/profile/notifications",
      label: "اعلان‌ها",
      icon: FiBell,
    },
  ];
  return (
    <div className="mx-auto max-w-5xl" data-dashboard-hub>
      <div className="mb-7 flex items-center justify-between gap-3 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-5 sm:p-7">
        <div>
          <p className="mb-2 text-xs font-bold text-emerald-700">
            الو گیاه / داشبورد
          </p>
          <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
            {hydrated && profile.data?.user?.fName
              ? `${profile.data.user.fName}، خوش آمدید`
              : "به داشبورد خوش آمدید"}
          </h1>
          <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm">
            امروز چه کاری می‌خواهید انجام دهید؟
          </p>
        </div>
        <div
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm"
        >
          <FiUser size={26} />
        </div>
      </div>
      {groups.map((group) => {
        const cards = group.paths.flatMap((path) =>
          items.filter((item) => item.path === path),
        );
        if (!cards.length) return null;
        return (
          <section key={group.title} className="mb-7" aria-label={group.title}>
            <h2 className="mb-4 text-base font-black text-slate-800">
              {group.title}
            </h2>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
              {cards.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="group flex min-h-32 min-w-0 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white px-2 py-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md focus-visible:outline-emerald-600"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${group.tone}`}
                  >
                    <item.icon size={24} />
                  </span>
                  <span className="text-[11px] font-bold leading-5 text-slate-700 sm:text-xs">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      <Link
        href="/product"
        className="mb-4 flex items-center justify-between rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-bold text-white"
      >
        مشاهدهٔ آگهی‌ها
        <FiArrowLeft size={20} />
      </Link>
    </div>
  );
}
