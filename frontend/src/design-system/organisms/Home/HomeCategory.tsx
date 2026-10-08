"use client";

import { setCategories } from "@/lib/store/slices/productFilterSlice";
import type { ICategoryTree } from "@/shared/types/categories";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  Flower2,
  Leaf,
  Search,
} from "lucide-react";

interface Props {
  categories: ICategoryTree[];
}

function categoryMatches(category: ICategoryTree, query: string): boolean {
  return (
    category.name.toLocaleLowerCase("fa-IR").includes(query) ||
    (category.subCategories ?? []).some((child) => categoryMatches(child, query))
  );
}

function collectCategoryCodes(category: ICategoryTree): string[] {
  return [
    category.code,
    ...(category.subCategories ?? []).flatMap(collectCategoryCodes),
  ];
}

function CategoryThumbnail({
  category,
  className = "",
}: {
  category: ICategoryTree;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`relative shrink-0 overflow-hidden bg-emerald-50 ${className}`}>
      {category.imageUrl && !failed ? (
        <Image
          src={getImageUrl(category.imageUrl)}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover transition duration-300 group-hover:scale-105"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-lime-100">
          <Flower2 className="h-9 w-9 text-emerald-700/70" strokeWidth={1.4} />
        </div>
      )}
    </div>
  );
}

function CategoryBranch({
  category,
  query,
  onSelect,
}: {
  category: ICategoryTree;
  query: string;
  onSelect: (category: ICategoryTree) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const children = (category.subCategories ?? []).filter(
    (child) => !query || categoryMatches(child, query),
  );

  return (
    <div className="min-w-0 border-r border-emerald-100 pr-3 sm:pr-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect(category)}
          className="min-w-0 flex-1 truncate rounded-lg px-2 py-2 text-right text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
        >
          {category.name}
        </button>
        {children.length > 0 ? (
          <button
            type="button"
            aria-label={`${expanded ? "بستن" : "باز کردن"} زیرشاخه‌های ${category.name}`}
            aria-expanded={expanded || Boolean(query)}
            onClick={() => setExpanded((value) => !value)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-emerald-700 transition hover:bg-emerald-100"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded || query ? "rotate-180" : ""}`}
            />
          </button>
        ) : (
          <button
            type="button"
            aria-label={`مشاهده محصولات ${category.name}`}
            onClick={() => onSelect(category)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-emerald-700 transition hover:bg-emerald-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>
      {children.length > 0 && (expanded || Boolean(query)) && (
        <div className="mt-1 space-y-1 pr-2">
          {children.map((child) => (
            <CategoryBranch
              key={child.code}
              category={child}
              query={query}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Categories({ categories }: Props) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [activeCategoryCode, setActiveCategoryCode] = useState(
    categories[0]?.code ?? "",
  );
  const query = search.trim().toLocaleLowerCase("fa-IR");
  const totalCategories = useMemo(() => {
    const count = (nodes: ICategoryTree[]): number =>
      nodes.reduce(
        (total, node) => total + 1 + count(node.subCategories ?? []),
        0,
      );
    return count(categories);
  }, [categories]);
  const visibleRoots = query
    ? categories.filter((category) => categoryMatches(category, query))
    : categories;
  const activeRoot =
    visibleRoots.find((category) => category.code === activeCategoryCode) ??
    visibleRoots[0];
  const activeRootMatches = Boolean(
    activeRoot?.name.toLocaleLowerCase("fa-IR").includes(query),
  );

  const openProducts = (category: ICategoryTree) => {
    dispatch(setCategories(category.code));
    const categoryCodes = collectCategoryCodes(category);
    const params = new URLSearchParams({
      category: category.code,
      categoryCodes: categoryCodes.join(","),
    });
    router.push(`/product?${params.toString()}`);
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <header className="mb-7 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <Leaf className="h-4 w-4" />
            الو گیاه
          </div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
            دسته‌بندی محصولات
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            از میان {totalCategories} دسته، محصول موردنظرتان را پیدا کنید.
          </p>
        </div>
        <label className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-500 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 sm:max-w-sm">
          <Search className="h-5 w-5 shrink-0 text-emerald-700" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جست‌وجو در دسته‌بندی‌ها"
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </label>
      </header>

      {visibleRoots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-14 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">
            دسته‌ای با این نام پیدا نشد
          </p>
          <p className="mt-1 text-xs text-slate-500">
            عبارت دیگری را جست‌وجو کنید.
          </p>
        </div>
      ) : (
        <section
          aria-label="درخت دسته‌بندی محصولات"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          dir="rtl"
        >
          <div className="border-b border-slate-100 bg-gradient-to-l from-emerald-50/80 to-white px-4 py-4 sm:px-6">
            <h2 className="font-bold text-slate-800">دسته‌های محصولات</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              دسته‌ی اصلی را انتخاب کنید و زیرشاخه‌ها را باز کنید.
            </p>
          </div>
          <div className="grid min-h-[420px] lg:grid-cols-[260px_minmax(0,1fr)]">
            <nav
              aria-label="دسته‌های اصلی"
              className="flex gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50/70 p-3 lg:flex-col lg:overflow-x-visible lg:border-b-0 lg:border-l lg:p-4"
            >
              {visibleRoots.map((category) => {
                const active = category.code === activeRoot?.code;
                return (
                  <button
                    key={category.code}
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => setActiveCategoryCode(category.code)}
                    className={`group flex min-w-max items-center gap-3 rounded-xl border px-3 py-2.5 text-right transition lg:w-full lg:min-w-0 ${
                      active
                        ? "border-emerald-200 bg-white text-emerald-800 shadow-sm"
                        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white"
                    }`}
                  >
                    <CategoryThumbnail
                      category={category}
                      className="h-10 w-10 rounded-lg"
                    />
                    <span className="max-w-40 truncate text-xs font-semibold sm:text-sm">
                      {category.name}
                    </span>
                    <ChevronLeft
                      className={`mr-auto hidden h-4 w-4 lg:block ${active ? "text-emerald-700" : "text-slate-300"}`}
                    />
                  </button>
                );
              })}
            </nav>

            {activeRoot && (
              <div className="min-w-0 p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <CategoryThumbnail
                      category={activeRoot}
                      className="h-12 w-12 rounded-xl"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400">دسته‌ی اصلی</p>
                      <h3 className="truncate font-bold text-slate-800">
                        {activeRoot.name}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openProducts(activeRoot)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
                  >
                    مشاهده همه محصولات
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </div>
                {(activeRoot.subCategories ?? []).some(
                  (child) =>
                    !query || activeRootMatches || categoryMatches(child, query),
                ) ? (
                  <div className="space-y-2">
                    {(activeRoot.subCategories ?? [])
                      .filter(
                        (child) =>
                          !query ||
                          activeRootMatches ||
                          categoryMatches(child, query),
                      )
                      .map((child) => (
                        <CategoryBranch
                          key={child.code}
                          category={child}
                          query={query}
                          onSelect={openProducts}
                        />
                      ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    زیرشاخه‌ای برای این دسته ثبت نشده است.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
