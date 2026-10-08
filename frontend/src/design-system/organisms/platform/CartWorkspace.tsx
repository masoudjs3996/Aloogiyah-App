"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  MinusIcon,
  PlusIcon,
  TrashIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { platformApi, errorMessage } from "@/lib/actions/platform";
import { usePlatformMutation } from "@/hooks/mutations/usePlatformMutation";
import { money, faNumber } from "@/shared/utils/platform";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import PageHeading from "@/design-system/molecules/platform/PageHeading";
import QueryState from "@/design-system/molecules/platform/QueryState";
import toast from "react-hot-toast";
export default function CartWorkspace() {
  const query = useQuery({
    queryKey: ["platform", "cart"],
    queryFn: platformApi.cart,
  });
  const client = useQueryClient();
  const router = useRouter();
  const update = usePlatformMutation(platformApi.updateCart, ["cart"]);
  const remove = usePlatformMutation(platformApi.removeCart, ["cart"]);
  const busy = update.isPending || remove.isPending;
  async function change(code: string, quantity: number) {
    if (!query.data) return;
    try {
      const cart = await update.mutateAsync({
        cartId: query.data.cartId,
        itemCode: code,
        quantity,
      });
      client.setQueryData(["platform", "cart"], cart);
      client.invalidateQueries({ queryKey: ["Cart"] });
    } catch {}
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeading
        title="سبد خرید"
        description="سفارش هر مزرعه به‌صورت جداگانه ارسال می‌شود."
      />
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => query.refetch()}
        skeleton="rows"
      >
        {query.data?.farms.length ? (
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              {query.data.farms.map((farm) => (
                <section
                  key={farm.farmCode}
                  className="rounded-2xl border border-slate-100 bg-white p-5"
                >
                  <div className="mb-4 flex flex-wrap justify-between gap-3 border-b border-slate-100 pb-4">
                    <Link
                      href={`/farm/${encodeURIComponent(farm.farmCode)}`}
                      className="font-bold text-slate-800"
                    >
                      {farm.farmName}
                    </Link>
                    <p className="text-sm text-emerald-700">
                      {money(farm.totalPrice)}
                    </p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {farm.items.map((item) => (
                      <div
                        key={item.code}
                        className="flex flex-wrap items-center justify-between gap-4 py-4"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/product/${encodeURIComponent(item.productCode)}`}
                            className="text-sm font-bold text-slate-700"
                          >
                            {item.productName}
                          </Link>
                          <p className="mt-2 text-xs text-slate-400">
                            قیمت واحد: {money(item.unitPrice)} | موجودی:{" "}
                            {faNumber(item.availableStock)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <ActionButton
                            variant="secondary"
                            aria-label="کاهش تعداد"
                            disabled={busy || item.quantity <= 1}
                            onClick={() => change(item.code, item.quantity - 1)}
                          >
                            <MinusIcon className="h-4 w-4" />
                          </ActionButton>
                          <span className="text-sm">
                            {faNumber(item.quantity)}
                          </span>
                          <ActionButton
                            variant="secondary"
                            aria-label="افزایش تعداد"
                            disabled={
                              busy || item.quantity >= item.availableStock
                            }
                            onClick={() => change(item.code, item.quantity + 1)}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </ActionButton>
                          <ActionButton
                            variant="danger"
                            aria-label="حذف از سبد"
                            disabled={busy}
                            onClick={async () => {
                              if (!query.data) return;
                              try {
                                const cart = await remove.mutateAsync({
                                  cartId: query.data.cartId,
                                  itemCode: item.code,
                                });
                                client.setQueryData(["platform", "cart"], cart);
                                client.invalidateQueries({
                                  queryKey: ["Cart"],
                                });
                              } catch {}
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </ActionButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <aside className="sticky top-24 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold">خلاصه سبد</h2>
              <div className="mb-4 flex justify-between text-sm text-slate-500">
                <span>تعداد</span>
                <span>{faNumber(query.data.itemCount)}</span>
              </div>
              <div className="mb-6 flex justify-between border-t border-slate-100 pt-4">
                <span className="text-sm">جمع کالاها</span>
                <strong className="text-emerald-800">
                  {money(query.data.totalPrice)}
                </strong>
              </div>
              <p className="mb-5 text-xs leading-6 text-slate-400">
                مبلغ نهایی و تخفیف در مرحله بعد توسط سرور محاسبه می‌شود.
              </p>
              <ActionButton
                disabled={busy}
                className="w-full"
                onClick={() =>
                  router.push(
                    query.data?.isGuest ? "/Login" : "/dashboard/checkout",
                  )
                }
              >
                ادامه خرید
              </ActionButton>
            </aside>
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-14 text-center">
            <ShoppingBagIcon className="mx-auto mb-5 h-16 w-16 text-emerald-200" />
            <p className="mb-6 text-slate-500">سبد خرید شما خالی است.</p>
            <Link
              href="/product"
              className="rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white"
            >
              مشاهده محصولات
            </Link>
          </div>
        )}
      </QueryState>
    </div>
  );
}
