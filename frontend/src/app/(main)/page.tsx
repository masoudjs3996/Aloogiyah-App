import Link from "next/link";
import BusinessInvitation from "@/design-system/organisms/Home/BusinessInvitation";
import {
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  CategoryCard,
  FarmCard,
  ProductCard,
} from "@/design-system/molecules/public";
import { BannerSlider } from "@/design-system/organisms/Home";
import PlatformLinks from "@/design-system/organisms/platform/PlatformLinks";
import { getFeaturedCategories } from "@/lib/actions/categories";
import { GetFarmsByFilter } from "@/lib/actions/farm";
import { getSlider } from "@/lib/actions/slider";

export const dynamic = "force-dynamic";

const highlights = [
  {
    icon: SparklesIcon,
    title: "آگهی‌های متنوع",
    description: "مشاهدهٔ آگهی‌های گلخانه‌ها و مزارع",
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "ارتباط با فروشنده",
    description: "گفت‌وگوی مستقیم درباره‌ی محصول و سفارش",
  },
  {
    icon: ClipboardDocumentCheckIcon,
    title: "مشخصات روشن",
    description: "هر آگهی با مشخصات لازم همان محصول ثبت می‌شود",
  },
  {
    icon: SparklesIcon,
    title: "ثبت آسان آگهی",
    description: "کشاورز در چند مرحله محصول خود را معرفی می‌کند",
  },
];

export default async function Home() {
  const [categoryResponse, farmResponse, sliderResponse] = await Promise.all([
    getFeaturedCategories(),
    GetFarmsByFilter(),
    getSlider(),
  ]);
  const categories = categoryResponse?.data ?? [];
  const farms = farmResponse?.data ?? [];
  const sliders = sliderResponse?.data ?? [];

  return (
    <div className="pb-8">
      <BannerSlider slider={sliders} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <BusinessInvitation />

        {categories.length > 0 && (
          <section className="mb-12" aria-labelledby="home-categories-title">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 id="home-categories-title" className="text-xl font-black text-slate-900 sm:text-2xl">
                  دسته‌بندی
                </h2>
              </div>
              <Link
                href="/categories"
                className="shrink-0 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50 sm:px-4 sm:text-sm"
              >
                همه دسته‌ها <span aria-hidden="true">←</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
              {categories.slice(0, 6).map((category) => (
                <div key={category.code} className={categories.length === 5 ? "min-w-0 lg:relative lg:-left-[calc(50%+0.5rem)]" : "min-w-0"}>
                  <CategoryCard category={category} />
                </div>
              ))}
            </div>
          </section>
        )}

        {farms.length > 0 && (
          <section className="mb-12 rounded-3xl bg-gradient-to-br from-emerald-50/80 via-white to-lime-50/70 p-4 sm:p-6 lg:p-8" aria-labelledby="home-farms-title">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold text-emerald-700">از نزدیک بشناس</p>
                <h2 id="home-farms-title" className="text-xl font-black text-slate-900 sm:text-2xl">
                  مزارع و گلخانه‌ها
                </h2>
                <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
                  با تولیدکنندگان آشنا شو و آگهی‌های هر مزرعه را یکجا ببین.
                </p>
              </div>
              <Link
                href="/farm"
                className="shrink-0 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-white sm:px-4 sm:text-sm"
              >
                مشاهده همه <span aria-hidden="true">←</span>
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {farms.slice(0, 3).map((farm: any, index: number) => (
                <FarmCard key={farm.farmCode || farm.code || index} farm={farm} />
              ))}
            </div>
          </section>
        )}

        <section className="mb-12" aria-labelledby="home-products-title">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-bold text-emerald-700">برای شروع خرید</p>
              <h2 id="home-products-title" className="text-xl font-black text-slate-900 sm:text-2xl">
                آگهی‌های منتخب
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
                جزئیات آگهی را ببین، درخواست خرید ثبت کن و مستقیم با کشاورز هماهنگ شو.
              </p>
            </div>
            <Link
              href="/product"
              className="shrink-0 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50 sm:px-4 sm:text-sm"
            >
              همهٔ آگهی‌ها <span aria-hidden="true">←</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <ProductCard />
          </div>
        </section>

        <div className="rounded-3xl border border-slate-100 bg-slate-50/70 py-1 sm:py-2">
          <PlatformLinks />
        </div>

        <section
          aria-label="ویژگی‌های الو گیاه"
          className="mt-8 grid grid-cols-2 gap-2 rounded-2xl border border-emerald-100 bg-white p-3 shadow-[0_12px_40px_-28px_rgba(6,95,70,0.5)] sm:grid-cols-4 sm:gap-3 sm:p-4"
        >
          {highlights.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex min-w-0 items-center gap-2.5 rounded-xl bg-emerald-50/70 p-3 sm:gap-3 sm:p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm sm:h-11 sm:w-11">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-[11px] font-bold text-slate-800 sm:text-sm">
                  {title}
                </h2>
                <p className="mt-1 hidden text-[11px] leading-5 text-slate-500 sm:block">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
