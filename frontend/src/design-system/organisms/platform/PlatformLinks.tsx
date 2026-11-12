import Link from "next/link";
import {
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
export const serviceCards = [
  {
    title: "ثبت آگهی محصول",
    description: "محصول مزرعه‌تان را با قیمت، موجودی و مشخصات دقیق ثبت کنید.",
    href: "/dashboard/farm/myFarms",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    title: "درخواست‌های خرید من",
    description: "درخواست‌ها و پیش‌فاکتورهای هماهنگی‌شده را یکجا ببینید.",
    href: "/dashboard/inquiries",
    icon: PaperAirplaneIcon,
  },
  {
    title: "گفت‌وگو",
    description: "برای قیمت نهایی، مقدار و تحویل مستقیم با فروشنده هماهنگ شوید.",
    href: "/dashboard/chat",
    icon: ChatBubbleLeftRightIcon,
  },
  {
    title: "وبلاگ",
    description: "مطالب کاربردی درباره گیاه و کشاورزی.",
    href: "/articles",
    icon: BookOpenIcon,
  },
];
export default function PlatformLinks() {
  return (
    <section className="mx-auto my-12 max-w-7xl px-4">
      <h2 className="mb-3 text-2xl font-bold text-slate-800">
        آگهی و هماهنگی مستقیم
      </h2>
      <p className="mb-6 text-sm text-slate-500">
        محصول مناسب را پیدا کنید و بی‌واسطه با کشاورز هماهنگ شوید.
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
