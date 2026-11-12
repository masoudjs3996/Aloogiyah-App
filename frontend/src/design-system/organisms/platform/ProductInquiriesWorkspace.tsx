"use client";

import { useState } from "react";
import Image from "next/image";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send } from "lucide-react";
import toast from "react-hot-toast";
import { errorMessage, platformApi } from "@/lib/actions/platform";
import { saleUnitLabel } from "@/shared/utils/sale-units";
import { faNumber, money } from "@/shared/utils/platform";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import type { ProductInquiry } from "@/shared/types/platform";
import Button from "@/design-system/atoms/platform/ActionButton";
import QueryState from "@/design-system/molecules/platform/QueryState";
import ChatRoomLink from "@/design-system/molecules/platform/ChatRoomLink";

const statusLabels: Record<string, string> = {
  Requested: "در حال بررسی",
  Contacted: "در حال هماهنگی",
  Agreed: "توافق شده",
  Declined: "رد شده",
  Cancelled: "لغو شده",
};

function InquiryThumbnail({ inquiry }: { inquiry: ProductInquiry }) {
  const source = getImageUrl(inquiry.primaryImageUrl);
  const [failedSource, setFailedSource] = useState<string>();
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-emerald-50">
      <Image src={source === failedSource ? "/placeholder.svg" : source} alt={inquiry.productName}
        fill unoptimized sizes="64px" className="object-cover" onError={() => setFailedSource(source)} />
    </div>
  );
}

export default function ProductInquiriesWorkspace() {
  const [role, setRole] = useState<"Buyer" | "Seller">("Buyer");
  const [filter, setFilter] = useState<"All" | "Pending" | "Reviewed">("All");
  const client = useQueryClient();
  const inquiries = useInfiniteQuery({
    queryKey: ["product-inquiries", role, filter],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => platformApi.productInquiries(role, filter, pageParam, signal),
    getNextPageParam: page => page.pageNumber * page.pageSize < page.totalCount ? page.pageNumber + 1 : undefined,
  });
  const items = inquiries.data?.pages.flatMap(page => page.items) ?? [];
  const farms = new Map<string, ProductInquiry[]>();
  for (const inquiry of items) {
    const key = inquiry.farmCode || inquiry.code;
    const group = farms.get(key);
    if (group) group.push(inquiry);
    else farms.set(key, [inquiry]);
  }
  const action = useMutation({
    mutationFn: ({ code, status }: { code: string; status: "Contacted" | "Agreed" | "Declined" | "Cancelled" }) => platformApi.actProductInquiry(code, status),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ["product-inquiries"] }); },
    onError: error => toast.error(errorMessage(error)),
  });
  return <section className="mx-auto max-w-5xl space-y-6" dir="rtl">
    <header className="rounded-3xl border border-emerald-100 bg-gradient-to-l from-emerald-50 to-white p-5 sm:p-7"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-700 text-white"><Send className="h-5 w-5" /></span><div><h1 className="text-xl font-bold text-slate-900 sm:text-2xl">درخواست‌های خرید</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">هر درخواست یک پیش‌فاکتور برای هماهنگی مستقیم خریدار و کشاورز است. در این مرحله هیچ پرداخت، کیف پول یا ارسال آنلاینی وجود ندارد.</p></div></div></header>
    <div className="space-y-3"><div className="inline-flex rounded-xl border border-slate-200 bg-white p-1"><button type="button" onClick={() => setRole("Buyer")} className={`rounded-lg px-4 py-2 text-sm font-bold ${role === "Buyer" ? "bg-emerald-700 text-white" : "text-slate-600"}`}>درخواست‌های من</button><button type="button" onClick={() => setRole("Seller")} className={`rounded-lg px-4 py-2 text-sm font-bold ${role === "Seller" ? "bg-emerald-700 text-white" : "text-slate-600"}`}>درخواست‌های دریافتی</button></div><div className="flex flex-wrap gap-2" aria-label="فیلتر وضعیت درخواست‌ها">{([ ["All", "همه"], ["Pending", "در حال بررسی"], ["Reviewed", "بررسی‌شده"] ] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${filter === value ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"}`}>{label}</button>)}</div></div>
    <QueryState loading={inquiries.isPending} error={inquiries.error} empty={!items.length} retry={() => inquiries.refetch()} emptyText={filter === "Pending" ? "درخواست در حال بررسی ندارید." : filter === "Reviewed" ? "درخواست بررسی‌شده‌ای ندارید." : role === "Buyer" ? "هنوز درخواستی ثبت نکرده‌اید." : "هنوز درخواستی برای آگهی‌های شما ثبت نشده است."} skeleton="rows">
      <div className="grid gap-4">
        {Array.from(farms, ([farmKey, group]) => (
          <article key={farmKey} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="font-bold text-emerald-800">{group[0].farmName}</h2>
            <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
              {group.map(inquiry => (
                <div key={inquiry.code} className="py-4 last:pb-0">
                  <div className="flex items-center gap-3">
                    <InquiryThumbnail inquiry={inquiry} />
                    <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-2">
                      <h3 className="min-w-0 break-words font-bold text-slate-900">{inquiry.productName}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${["Declined", "Cancelled"].includes(inquiry.status) ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {statusLabels[inquiry.status] || inquiry.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-2">
                    <p>مقدار درخواستی: <b>{faNumber(inquiry.quantity)} {saleUnitLabel(inquiry.saleUnit)}</b></p>
                    <p>برآورد مبلغ آگهی: <b>{money(inquiry.estimatedTotal)}</b></p>
                  </div>
                  {inquiry.message && <p className="mt-3 break-words text-sm leading-7 text-slate-600">پیام خریدار: {inquiry.message}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ChatRoomLink receiverCode={role === "Buyer" ? inquiry.sellerCode : inquiry.buyerCode} contextName={inquiry.productName} contextType="درخواست خرید" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800">
                      <MessageCircle className="h-4 w-4" />گفت‌وگو
                    </ChatRoomLink>
                    {role === "Seller" && inquiry.status === "Requested" && <Button busy={action.isPending} onClick={() => action.mutate({ code: inquiry.code, status: "Contacted" })}>شروع هماهنگی</Button>}
                    {role === "Seller" && inquiry.status === "Contacted" && <Button busy={action.isPending} onClick={() => action.mutate({ code: inquiry.code, status: "Agreed" })}>ثبت توافق</Button>}
                    {role === "Seller" && ["Requested", "Contacted"].includes(inquiry.status) && <Button variant="secondary" busy={action.isPending} onClick={() => action.mutate({ code: inquiry.code, status: "Declined" })}>رد درخواست</Button>}
                    {role === "Buyer" && ["Requested", "Contacted"].includes(inquiry.status) && <Button variant="secondary" busy={action.isPending} onClick={() => action.mutate({ code: inquiry.code, status: "Cancelled" })}>لغو درخواست</Button>}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
      {inquiries.hasNextPage && <Button variant="secondary" busy={inquiries.isFetchingNextPage} onClick={() => void inquiries.fetchNextPage()}>درخواست‌های بیشتر</Button>}
    </QueryState>
  </section>;
}
