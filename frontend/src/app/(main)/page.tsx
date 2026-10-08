import Link from "next/link";
import {
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
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
    title: "محصولات متنوع",
    description: "انتخاب از میان محصولات گلخانه‌ها و مزارع",
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "ارتباط با فروشنده",
    description: "گفت‌وگوی مستقیم درباره‌ی محصول و سفارش",
  },
  {
    icon: ClipboardDocumentCheckIcon,
    title: "ارزیابی کیفیت",
    description: "درخواست بررسی محصول توسط کارشناس",
  },
  {
    icon: WrenchScrewdriverIcon,
    title: "خدمات گیاه‌پزشکی",
    description: "پیدا کردن خدمات نگهداری و رسیدگی به گیاهان",
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
      {sliders.length > 0 && <BannerSlider slider={sliders} />}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="relative z-10 mb-5 mt-5 overflow-hidden rounded-3xl bg-gradient-to-l from-emerald-800 via-emerald-700 to-teal-700 px-5 py-6 text-white shadow-lg sm:mt-7 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-bold text-emerald-100 sm:text-sm">
                الو گیاه؛ میدان بار مجازی گل و گیاه
              </p>
              <h1 className="text-2xl font-black leading-tight sm:text-3xl">
                از مزرعه تا خانه، ساده‌تر از همیشه
              </h1>
              <p className="mt-3 text-xs leading-6 text-emerald-50 sm:text-sm">
                محصولات مزارع و گلخانه‌ها را پیدا کن، جزئیاتشان را ببین و مستقیم با فروشنده در ارتباط باش.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/product"
                className="rounded-xl bg-white px-4 py-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50 sm:text-sm"
              >
                دیدن محصولات
              </Link>
              <Link
                href="/farm"
                className="rounded-xl border border-white/40 bg-white/10 px-4 py-3 text-xs font-bold text-white transition hover:bg-white/20 sm:text-sm"
              >
                آشنایی با مزارع
              </Link>
            </div>
          </div>
        </section>

        <section
          aria-label="ویژگی‌های الو گیاه"
          className="mb-10 grid grid-cols-2 gap-2 rounded-2xl border border-emerald-100 bg-white p-3 shadow-[0_12px_40px_-28px_rgba(6,95,70,0.5)] sm:grid-cols-4 sm:gap-3 sm:p-4"
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

        {categories.length > 0 && (
          <section className="mb-12" aria-labelledby="home-categories-title">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold text-emerald-700">انتخاب راحت‌تر</p>
                <h2 id="home-categories-title" className="text-xl font-black text-slate-900 sm:text-2xl">
                  دسته‌بندی‌های محبوب
                </h2>
                <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
                  از دسته‌ی موردنظرت شروع کن و محصولات مرتبط را ببین.
                </p>
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
                <CategoryCard key={category.code} category={category} />
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
                  با تولیدکنندگان آشنا شو و محصولات هر مزرعه را یکجا ببین.
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
                محصولات منتخب
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
                جزئیات محصول را ببین و بعد از انتخاب، آن را به سبدت اضافه کن.
              </p>
            </div>
            <Link
              href="/product"
              className="shrink-0 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50 sm:px-4 sm:text-sm"
            >
              همه محصولات <span aria-hidden="true">←</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            <ProductCard />
          </div>
        </section>

        <div className="rounded-3xl border border-slate-100 bg-slate-50/70 py-1 sm:py-2">
          <PlatformLinks />
        </div>
      </div>
    </div>
  );
}
