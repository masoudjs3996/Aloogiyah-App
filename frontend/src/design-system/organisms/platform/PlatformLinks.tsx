import Link from "next/link";
import {
  WrenchScrewdriverIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  BoltIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
export const serviceCards = [
  {
    title: "کارشناس گیاه در منزل",
    description: "رسیدگی به گلدان، باغچه و گلخانه با همراهی کارشناس.",
    href: "/dashboard/services",
    icon: WrenchScrewdriverIcon,
  },
  {
    title: "تعیین کیفیت محصول",
    description: "بررسی گزارش کیفیت و قیمت پیشنهادی پیش از خرید.",
    href: "/dashboard/quality",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    title: "حراج محصولات",
    description: "مشاهده حراج‌ها و ثبت پیشنهاد قیمت.",
    href: "/dashboard/auctions",
    icon: BoltIcon,
  },
  {
    title: "گفت‌وگو",
    description: "ارتباط مستقیم با فروشنده و کارشناس.",
    href: "/dashboard/chat",
    icon: ChatBubbleLeftRightIcon,
  },
  {
    title: "مجله الو گیاه",
    description: "مطالب کاربردی درباره گیاه و کشاورزی.",
    href: "/articles",
    icon: BookOpenIcon,
  },
  {
    title: "سفارش‌های من",
    description: "پیگیری پرداخت، آماده‌سازی و تحویل خریدها.",
    href: "/dashboard/orders",
    icon: ShoppingBagIcon,
  },
];
export default function PlatformLinks() {
  return (
    <section className="mx-auto my-12 max-w-7xl px-4">
      <h2 className="mb-3 text-2xl font-bold text-slate-800">
        بیشتر از یک فروشگاه
      </h2>
      <p className="mb-6 text-sm text-slate-500">
        برای گیاه و محصول شما، در هر مرحله همراهتان هستیم.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {serviceCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-emerald-100 bg-white p-6 transition hover:shadow-md"
          >
            <card.icon className="mb-4 h-8 w-8 text-emerald-600" />
            <h3 className="mb-2 font-bold">{card.title}</h3>
            <p className="text-sm leading-7 text-slate-500">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
