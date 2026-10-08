"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePlatformProfile } from "@/hooks/queries/usePlatform";
import { platformApi } from "@/lib/actions/platform";
import { faNumber } from "@/shared/utils/platform";
import PageHeading from "@/design-system/molecules/platform/PageHeading";
import QueryState from "@/design-system/molecules/platform/QueryState";
import { serviceCards } from "./PlatformLinks";
export default function DashboardOverview() {
  const profile = usePlatformProfile();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const orders = useQuery({
    queryKey: ["platform", "orders", "overview"],
    queryFn: () => platformApi.orders({ View: "Buyer", PageSize: 1 }),
  });
  const services = useQuery({
    queryKey: ["platform", "services", "overview"],
    queryFn: () => platformApi.services({ PageSize: 1 }),
  });
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading
        title={
          hydrated && profile.data?.user?.fName
            ? `${profile.data.user.fName}، به الو گیاه خوش آمدید`
            : "به الو گیاه خوش آمدید"
        }
        description="از خرید محصول تا رسیدگی به گیاه؛ همه چیز از همین‌جا شروع می‌شود."
      />
      <div className="mb-7 grid gap-4 sm:grid-cols-2">
        {[
          { label: "سفارش‌های خرید", query: orders, href: "/dashboard/orders" },
          {
            label: "درخواست‌های خدمات قابل دسترس",
            query: services,
            href: "/dashboard/services",
          },
        ].map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className="rounded-2xl border border-slate-100 bg-white p-6"
          >
            <p className="mb-4 text-sm text-slate-500">{stat.label}</p>
            <QueryState
              loading={stat.query.isLoading}
              error={stat.query.error}
              retry={() => stat.query.refetch()}
              skeleton="inline"
            >
              <strong className="text-3xl text-emerald-800">
                {faNumber(stat.query.data?.totalCount || 0)}
              </strong>
            </QueryState>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {serviceCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-slate-100 bg-white p-6 transition hover:border-emerald-200 hover:shadow-sm"
          >
            <card.icon className="mb-4 h-8 w-8 text-emerald-600" />
            <h2 className="mb-2 font-bold text-slate-800">{card.title}</h2>
            <p className="text-sm leading-7 text-slate-500">
              {card.description}
            </p>
            <span className="mt-5 block text-xs font-bold text-emerald-700">
              مشاهده بخش ←
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
