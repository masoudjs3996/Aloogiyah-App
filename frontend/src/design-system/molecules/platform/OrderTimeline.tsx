import { ClipboardDocumentListIcon, ClockIcon, CheckBadgeIcon, TruckIcon, HomeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { Order } from "@/shared/types/platform";
import { orderTrackingState, orderProgressSteps, orderStatusLabel } from "@/shared/constants/order-statuses";
const stepIcons = [ClipboardDocumentListIcon, ClockIcon, CheckBadgeIcon, TruckIcon, HomeIcon];

export default function OrderTimeline({ order }: { order: Pick<Order, "statusCode" | "statusTitle" | "history"> & Partial<Pick<Order, "orderItems">> }) {
  const { stopped, current, reached, delivered } = orderTrackingState(order);
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4">
      <ol aria-label="مراحل سفارش" className="flex" dir="rtl">
        {orderProgressSteps.map((step, index) => {
          const Icon = stepIcons[index];
          const active = !stopped && current === index;
          const complete = index === 0 || (stopped ? index <= reached : index < reached || delivered);
          return (
            <li key={step.code} aria-current={active ? "step" : undefined} className="relative flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
              {index < orderProgressSteps.length - 1 && <span aria-hidden="true" className={`absolute right-1/2 top-3.5 h-0.5 w-full ${index < reached ? "bg-emerald-500" : "bg-slate-200"}`} />}
              <span aria-hidden="true" className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 ${complete ? "border-emerald-600 bg-emerald-600 text-white" : active ? "border-emerald-600 bg-white text-emerald-700 ring-4 ring-emerald-100" : "border-slate-200 bg-white text-slate-400"}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className={`px-0.5 text-[10px] leading-5 sm:text-xs ${complete || active ? "font-bold text-emerald-800" : "text-slate-400"}`}>{step.label}<span className="sr-only">{complete ? "، انجام‌شده" : active ? "، مرحله فعلی" : "، انجام‌نشده"}</span></span>
            </li>
          );
        })}
      </ol>
      {stopped && <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700"><XMarkIcon aria-hidden="true" className="h-4 w-4" />{orderStatusLabel(order.statusCode, order.statusTitle)}</p>}
    </div>
  );
}
