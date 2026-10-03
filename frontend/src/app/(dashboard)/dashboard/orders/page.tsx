"use client";

import { useMemo, useState, type ReactNode } from "react";

// ======================================================
// Types — مدل داده‌ها
// بعداً با ساختار پاسخ API هماهنگ می‌کنیم.
// ======================================================

type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

type OrderProduct = {
  id: number;
  name: string;
  image: string;
  quantity: number;
};

type Order = {
  id: number;
  number: string;
  createdAt: string;
  status: OrderStatus;
  statusLabel?: string;
  totalPrice: number;
  products: OrderProduct[];
};

type OrderFilter = "all" | OrderStatus;

type IconName =
  | "bag"
  | "clock"
  | "truck"
  | "check"
  | "search"
  | "calendar"
  | "arrow"
  | "close";

// ======================================================
// Constants — داده‌های نمونه و تنظیمات نمایش
// واحد totalPrice در این نمونه تومان است.
// ======================================================

const MOCK_ORDERS: Order[] = [
  {
    id: 1,
    number: "1024",
    createdAt: "2026-10-02T10:00:00+03:30",
    status: "processing",
    statusLabel: "بررسی موجودی",
    totalPrice: 2450000,
    products: [
      {
        id: 11,
        name: "مونسترا",
        image:
          "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=300&auto=format&fit=crop&q=80",
        quantity: 1,
      },
      {
        id: 12,
        name: "پتوس طلایی",
        image:
          "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300&auto=format&fit=crop&q=80",
        quantity: 1,
      },
    ],
  },
  {
    id: 2,
    number: "1018",
    createdAt: "2026-09-19T10:00:00+03:30",
    status: "shipped",
    totalPrice: 1850000,
    products: [
      {
        id: 21,
        name: "پتوس طلایی",
        image:
          "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300&auto=format&fit=crop&q=80",
        quantity: 2,
      },
      {
        id: 22,
        name: "فیکوس الاستیکا",
        image:
          "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=300&auto=format&fit=crop&q=80",
        quantity: 1,
      },
    ],
  },
  {
    id: 3,
    number: "1006",
    createdAt: "2026-09-06T10:00:00+03:30",
    status: "delivered",
    totalPrice: 950000,
    products: [
      {
        id: 31,
        name: "سانسوریا",
        image:
          "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=300&auto=format&fit=crop&q=80",
        quantity: 1,
      },
    ],
  },
];

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  processing: {
    label: "در حال پردازش",
    className: "bg-amber-50 text-amber-700",
  },
  shipped: {
    label: "ارسال شده",
    className: "bg-blue-50 text-blue-700",
  },
  delivered: {
    label: "تحویل شده",
    className: "bg-emerald-50 text-emerald-700",
  },
  cancelled: {
    label: "لغو شده",
    className: "bg-red-50 text-red-700",
  },
};

const FILTERS: { value: OrderFilter; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "processing", label: "در حال پردازش" },
  { value: "shipped", label: "ارسال شده" },
  { value: "delivered", label: "تحویل شده" },
  { value: "cancelled", label: "لغو شده" },
];

const STAT_ITEMS: {
  filter: OrderFilter;
  label: string;
  icon: IconName;
  iconClassName: string;
}[] = [
  {
    filter: "all",
    label: "همه سفارش‌ها",
    icon: "bag",
    iconClassName: "bg-[#E7F1E9] text-[#205C43]",
  },
  {
    filter: "processing",
    label: "در حال پردازش",
    icon: "clock",
    iconClassName: "bg-amber-50 text-amber-600",
  },
  {
    filter: "shipped",
    label: "ارسال شده",
    icon: "truck",
    iconClassName: "bg-blue-50 text-blue-600",
  },
  {
    filter: "delivered",
    label: "تحویل شده",
    icon: "check",
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
];

// ======================================================
// Utilities — فرمت عدد، تاریخ و عبارت جستجو
// ======================================================

const numberFormatter = new Intl.NumberFormat("fa-IR");

const dateFormatter = new Intl.DateTimeFormat("fa-IR", {
  calendar: "persian",
  timeZone: "Asia/Tehran",
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatNumber(value: number | string) {
  return numberFormatter.format(Number(value));
}

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

function normalizeSearch(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[#\s]/g, "");
}

// ======================================================
// Atom — آیکون
// SVG داخلی: نیازی به نصب کتابخانه آیکون ندارد.
// ======================================================

const ICON_PATHS: Record<IconName, ReactNode> = {
  bag: (
    <>
      <path d="M6 7h12l1 13H5L6 7Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  truck: (
    <>
      <path d="M3 5h11v12H3V5Z" />
      <path d="M14 9h4l3 4v4h-7" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4m8-4v4M4 11h16" />
    </>
  ),
  arrow: <path d="m14 6-6 6 6 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
};

function OrderIcon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 shrink-0 ${className}`}
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

// ======================================================
// Atom — دکمه
// ======================================================

function OrderButton({
  children,
  onClick,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex min-h-11 items-center justify-center gap-2
        rounded-xl px-4 py-3 text-sm font-medium
        transition-colors
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[#205C43] focus-visible:ring-offset-2
        ${
          variant === "primary"
            ? "bg-[#205C43] text-white hover:bg-[#174632]"
            : "border border-[#CDDAD1] bg-white text-[#205C43] hover:bg-[#F1F6F2]"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// ======================================================
// Atom — برچسب وضعیت
// ======================================================

function OrderStatusBadge({
  status,
  label,
}: {
  status: OrderStatus;
  label?: string;
}) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`
        inline-flex items-center gap-2 rounded-full
        px-3 py-1.5 text-xs font-medium
        ${config.className}
      `}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full bg-current"
        aria-hidden="true"
      />
      {label ?? config.label}
    </span>
  );
}

// ======================================================
// Atom — مبلغ
// ======================================================

function OrderPrice({ amount }: { amount: number }) {
  return (
    <p className="flex flex-wrap items-baseline gap-1.5 text-[#205C43]">
      <span className="text-xl font-bold tabular-nums">
        {formatNumber(amount)}
      </span>
      <span className="text-sm font-semibold">تومان</span>
    </p>
  );
}

// ======================================================
// Atom — تصویر محصول با حالت جایگزین
// تصاویر فعلاً نمونه هستند.
// ======================================================

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-[#F1F3EE]">
      {failed ? (
        <span role="img" aria-label={alt} className="text-3xl">
          🌿
        </span>
      ) : (
        // برای تصاویر نمونه از img استفاده شده تا remotePatterns لازم نباشد.
        // بعد از مشخص شدن دامنه تصاویر API می‌توان به next/image تبدیل کرد.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={112}
          height={112}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}

// ======================================================
// Molecule — پیش‌نمایش محصول
// ======================================================

function OrderProductPreview({ product }: { product: OrderProduct }) {
  return (
    <div className="w-24 shrink-0 sm:w-28">
      <ProductImage src={product.image} alt={product.name} />

      <p className="mt-2 truncate text-center text-xs font-medium text-[#28372D] sm:text-sm">
        {product.name}
      </p>

      <p className="mt-1 text-center text-xs text-gray-500">
        {formatNumber(product.quantity)} عدد
      </p>
    </div>
  );
}

// ======================================================
// Molecule — کارت آمار قابل کلیک
// ======================================================

function OrderStatCard({
  label,
  count,
  icon,
  iconClassName,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon: IconName;
  iconClassName: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`
        flex min-w-0 items-center gap-3 rounded-2xl border
        p-4 text-right transition-colors sm:gap-4 sm:p-5
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[#205C43]
        ${
          active
            ? "border-[#B8D0BF] bg-[#F0F6F1]"
            : "border-[#E4E9E3] bg-white hover:border-[#B8D0BF]"
        }
      `}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:h-12 sm:w-12 ${iconClassName}`}
      >
        <OrderIcon name={icon} className="h-6 w-6" />
      </span>

      <span className="min-w-0">
        <span className="block text-xs text-gray-600 sm:text-sm">
          {label}
        </span>
        <span className="mt-1 block text-2xl font-bold text-[#1D2B22]">
          {formatNumber(count)}
        </span>
      </span>
    </button>
  );
}

// ======================================================
// Molecule — جستجوی سفارش
// ======================================================

function OrderSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative w-full lg:w-72">
      <label htmlFor="order-search" className="sr-only">
        جستجوی شماره سفارش
      </label>

      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
        <OrderIcon name="search" />
      </span>

      <input
        id="order-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="جستجوی شماره سفارش"
        className="
          min-h-12 w-full rounded-xl border border-[#E0E6DF]
          bg-white py-3 pl-4 pr-12 text-sm text-[#28372D]
          outline-none transition
          placeholder:text-gray-400
          focus:border-[#205C43] focus:ring-2 focus:ring-[#205C43]/10
        "
      />
    </div>
  );
}

// ======================================================
// Molecule — فیلتر وضعیت
// از aria-pressed استفاده شده چون این دکمه‌ها فیلتر هستند.
// ======================================================

function OrderFilters({
  value,
  onChange,
}: {
  value: OrderFilter;
  onChange: (value: OrderFilter) => void;
}) {
  return (
    <div
      role="group"
      aria-label="فیلتر وضعیت سفارش‌ها"
      className="flex w-full min-w-0 overflow-x-auto rounded-xl border border-[#E4E9E3] bg-white p-1 lg:w-auto"
    >
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          aria-pressed={value === filter.value}
          onClick={() => onChange(filter.value)}
          className={`
            min-h-10 shrink-0 whitespace-nowrap rounded-lg
            px-4 py-2 text-xs font-medium transition-colors sm:text-sm
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-inset focus-visible:ring-[#205C43]
            ${
              value === filter.value
                ? "bg-[#205C43] text-white"
                : "text-gray-600 hover:bg-[#F1F6F2] hover:text-[#205C43]"
            }
          `}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

// ======================================================
// Organism — کارت سفارش
// نمایش حداکثر ۳ محصول برای جلوگیری از شلوغ شدن کارت
// ======================================================

function OrderCard({
  order,
  onViewDetails,
}: {
  order: Order;
  onViewDetails: (order: Order) => void;
}) {
  const visibleProducts = order.products.slice(0, 3);
  const remainingCount = order.products.length - visibleProducts.length;

  return (
    <article
      aria-labelledby={`order-title-${order.id}`}
      className="
        grid min-w-0 gap-5 rounded-2xl border border-[#E4E9E3]
        bg-white p-4 sm:p-5
        xl:grid-cols-[200px_minmax(0,1fr)_230px] xl:items-center xl:gap-6
      "
    >
      {/* اطلاعات اصلی سفارش */}
      <div className="flex flex-wrap items-start justify-between gap-3 xl:flex-col xl:justify-start xl:gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2
            id={`order-title-${order.id}`}
            className="text-base font-bold text-[#1D2B22]"
          >
            <span className="sr-only">سفارش شماره </span>
            <bdi>#{formatNumber(order.number)}</bdi>
          </h2>

          <OrderStatusBadge
            status={order.status}
            label={order.statusLabel}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 sm:text-sm">
          <OrderIcon name="calendar" className="h-4 w-4" />
          <time dateTime={order.createdAt}>
            {formatDate(order.createdAt)}
          </time>
        </div>
      </div>

      {/* پیش‌نمایش محصولات */}
      <div className="flex min-w-0 items-center gap-3 overflow-x-auto pb-1 xl:justify-center">
        {visibleProducts.map((product) => (
          <OrderProductPreview key={product.id} product={product} />
        ))}

        {remainingCount > 0 && (
          <div className="flex h-24 w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-[#F1F6F2] text-[#205C43]">
            <span className="text-xl font-bold">
              +{formatNumber(remainingCount)}
            </span>
            <span className="mt-1 text-xs">محصول دیگر</span>
          </div>
        )}
      </div>

      {/* مبلغ و دکمه مشاهده جزئیات */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#EDF0EB] pt-4 xl:flex-col xl:items-start xl:border-t-0 xl:pt-0">
        <div>
          <p className="mb-1.5 text-xs text-gray-500">
            مبلغ کل سفارش
          </p>
          <OrderPrice amount={order.totalPrice} />
        </div>

        <OrderButton
          onClick={() => onViewDetails(order)}
          className="w-full sm:w-auto xl:w-full"
        >
          مشاهده جزئیات
          <OrderIcon name="arrow" className="h-4 w-4" />
        </OrderButton>

        {/* اتصال پیگیری مرسوله بعد از دریافت API انجام می‌شود. */}
      </div>
    </article>
  );
}

// ======================================================
// Organism — حالت خالی
// ======================================================

function OrdersEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#CFDCD1] bg-white px-6 py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0F6F1] text-[#205C43]">
        <OrderIcon name="bag" className="h-8 w-8" />
      </span>

      <h2 className="mt-5 text-lg font-bold text-[#28372D]">
        سفارشی پیدا نشد
      </h2>

      <p className="mt-2 text-sm leading-7 text-gray-500">
        با این شماره یا وضعیت، سفارشی برای نمایش وجود ندارد.
      </p>

      <OrderButton
        variant="secondary"
        onClick={onReset}
        className="mt-5"
      >
        پاک کردن فیلترها
      </OrderButton>
    </div>
  );
}

// ======================================================
// Organism — جزئیات سفارش انتخاب‌شده
// فعلاً یک پنل داخل صفحه است؛ بعداً می‌تواند صفحه مستقل شود.
// ======================================================

function OrderDetails({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  return (
    <section
      aria-labelledby="order-details-title"
      className="mb-5 rounded-2xl border border-[#B8D0BF] bg-[#F0F6F1] p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id="order-details-title"
          className="text-base font-bold text-[#205C43]"
        >
          جزئیات سفارش <bdi>#{formatNumber(order.number)}</bdi>
        </h2>

        <button
          type="button"
          onClick={onClose}
          aria-label="بستن جزئیات سفارش"
          className="rounded-lg p-2 text-[#205C43] hover:bg-[#E2EDE4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#205C43]"
        >
          <OrderIcon name="close" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <OrderStatusBadge
          status={order.status}
          label={order.statusLabel}
        />
        <span>{formatDate(order.createdAt)}</span>
      </div>

      <ul className="mt-4 divide-y divide-[#DCE6DC]">
        {order.products.map((product) => (
          <li
            key={product.id}
            className="flex items-center justify-between gap-4 py-3 text-sm"
          >
            <span className="text-[#28372D]">{product.name}</span>
            <span className="shrink-0 text-gray-500">
              {formatNumber(product.quantity)} عدد
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE6DC] pt-4">
        <span className="text-sm text-gray-600">مبلغ کل سفارش</span>
        <OrderPrice amount={order.totalPrice} />
      </div>
    </section>
  );
}

// ======================================================
// Page — مدیریت داده، فیلتر و ترکیب کامپوننت‌ها
// سایدبار و هدر داشبورد باید در layout پروژه قرار داشته باشند.
// ======================================================

const OrderPage = () => {
  const [activeFilter, setActiveFilter] = useState<OrderFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // API CONNECTION:
  // بعداً خروجی هوک دریافت سفارش‌ها را جایگزین MOCK_ORDERS کن.
  const orders = MOCK_ORDERS;

  const counts = useMemo(() => {
    const result: Record<OrderFilter, number> = {
      all: orders.length,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      result[order.status] += 1;
    });

    return result;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = normalizeSearch(search);

    return orders.filter((order) => {
      const matchesStatus =
        activeFilter === "all" || order.status === activeFilter;

      const matchesSearch = normalizeSearch(order.number).includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [orders, activeFilter, search]);

  const selectedOrder = orders.find(
    (order) => order.id === selectedOrderId,
  );

  const resetFilters = () => {
    setActiveFilter("all");
    setSearch("");
  };

  return (
    <div
      dir="rtl"
      className="min-h-full w-full min-w-0 bg-[#F7F8F5] p-4 text-[#28372D] sm:p-6 lg:p-8"
    >
      <div className="mx-auto w-full max-w-7xl">
        {/* عنوان صفحه */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            سفارش‌های من
          </h1>

          <p className="mt-2 text-sm leading-7 text-gray-500">
            سفارش‌های خود را ببینید و پیگیری کنید.
          </p>
        </header>

        {/* آمار سفارش‌ها */}
        <section
          aria-label="آمار سفارش‌ها"
          className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          {STAT_ITEMS.map((item) => (
            <OrderStatCard
              key={item.filter}
              label={item.label}
              count={counts[item.filter]}
              icon={item.icon}
              iconClassName={item.iconClassName}
              active={activeFilter === item.filter}
              onClick={() => setActiveFilter(item.filter)}
            />
          ))}
        </section>

        {/* فیلتر و جستجو */}
        <section
          aria-label="جستجو و فیلتر سفارش‌ها"
          className="mb-5 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        >
          <OrderFilters
            value={activeFilter}
            onChange={setActiveFilter}
          />

          <OrderSearch value={search} onChange={setSearch} />
        </section>

        {/* اعلام تعداد نتایج برای دسترس‌پذیری */}
        <p role="status" className="sr-only">
          {formatNumber(filteredOrders.length)} سفارش یافت شد.
        </p>

        {/* جزئیات سفارش انتخاب‌شده */}
        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onClose={() => setSelectedOrderId(null)}
          />
        )}

        {/* لیست سفارش‌ها */}
        {filteredOrders.length > 0 ? (
          <section aria-label="لیست سفارش‌ها" className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetails={(selected) =>
                  setSelectedOrderId(selected.id)
                }
              />
            ))}
          </section>
        ) : (
          <OrdersEmptyState onReset={resetFilters} />
        )}
      </div>
    </div>
  );
};

export default OrderPage;