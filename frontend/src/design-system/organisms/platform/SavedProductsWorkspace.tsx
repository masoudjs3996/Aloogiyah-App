"use client";
import { saleUnitLabel } from "@/shared/utils/sale-units";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import { useSavedProducts } from "@/hooks/queries/useSavedProducts";
import { money } from "@/shared/utils/platform";
import PageHeading from "@/design-system/molecules/platform/PageHeading";
import QueryState from "@/design-system/molecules/platform/QueryState";
import SaveProductButton from "@/design-system/molecules/public/SaveProductButton";
export default function SavedProductsWorkspace() {
  const { query } = useSavedProducts();
  return <div className="mx-auto max-w-6xl"><PageHeading title="آگهی‌های ذخیره‌شده" description="آگهی‌هایی که پسندیده‌اید را اینجا پیدا کنید." />
    <QueryState loading={query.isLoading} error={query.error} retry={() => query.refetch()} empty={!query.data?.length} emptyText="هنوز محصولی ذخیره نکرده‌اید." skeleton="cards">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{query.data?.map((product) => <article key={product.productCode} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl bg-emerald-50"><Image src={getImageUrl(product.primaryImageUrl)} alt={product.name} fill unoptimized sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className="object-cover" /></div><h2 className="font-bold leading-7 text-slate-900">{product.name}</h2><p className="mt-2 text-xs text-slate-500">{product.farmName}</p>
        <p className="my-4 font-bold text-emerald-800">{product.isAvailable ? money(product.retailPrice)+" برای هر "+saleUnitLabel(product.saleUnit) : "این محصول در حال حاضر در دسترس نیست"}</p>
        <div className="mt-auto flex flex-wrap gap-2"><SaveProductButton code={product.productCode} />{product.isAvailable && <Link href={`/product/${encodeURIComponent(product.productCode)}`} className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-700 px-3 py-3 text-xs font-bold text-white hover:bg-emerald-800">مشاهده جزئیات ←</Link>}</div>
      </article>)}</div>
    </QueryState></div>;
}
