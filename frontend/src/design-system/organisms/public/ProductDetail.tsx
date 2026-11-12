"use client";
import { saleUnitLabel, saleDigits } from "@/shared/utils/sale-units";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BuildingStorefrontIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { request, paged, errorMessage } from "@/lib/actions/platform";
import type { ProductInquiry, StoreProduct } from "@/shared/types/platform";
import { faNumber } from "@/shared/utils/platform";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import SaveProductButton from "@/design-system/molecules/public/SaveProductButton";
import ProductReportForm from "@/design-system/molecules/public/ProductReportForm";
import ListingSpecifications from "@/design-system/molecules/platform/ListingSpecifications";
import { MessageCircle, Plus, Minus, Send } from "lucide-react";
import ActionButton from "@/design-system/atoms/platform/ActionButton";
import QueryState from "@/design-system/molecules/platform/QueryState";
import ChatRoomLink from "@/design-system/molecules/platform/ChatRoomLink";
import FormPanel from "@/design-system/molecules/platform/FormPanel";
import SafeArticleContent from "@/design-system/molecules/platform/SafeArticleContent";
import { SkeletonBlock } from "@/design-system/molecules/platform/Skeleton";
import AddCommentForm from "../Home/AddCommentForm";
import { StoreProductCard } from "../platform/ProductsWorkspace";
import ProductPrice from "@/design-system/molecules/public/ProductPrice";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { publicDetailPath } from "@/shared/utils/public-detail-path";
type ProductComment = {
  code: string;
  content: string;
  name?: string;
  userFullName?: string;
  userName?: string;
  createdAt: string;
  rating?: number | null;
  replies?: ProductComment[];
  subComments?: ProductComment[];
};
type ProductFarm = {
  code: string;
  name: string;
  imageUrl?: string;
  ownerCode: string;
  capacity?: number;
  minPurchase?: number;
  address?: {
    provinceName?: string;
    countyName?: string;
  };
};
type ProductRatingSummary = {
  averageRating: number;
  ratingCount: number;
};
type OwnProductReview = {
  code: string;
  content: string;
  rating?: number | null;
  statusCode: string;
};
export default function ProductDetail({ productId, initialProduct }: { productId: string; initialProduct: StoreProduct }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["platform", "product", productId],
    queryFn: () =>
      request<StoreProduct>("/AgriculturalListing/GetByCode", {
        params: { code: productId },
      }),
    enabled: !!productId,
    initialData: initialProduct,
  });
  const comments = useQuery({
    queryKey: ["getCommentsTree", productId],
    queryFn: () =>
      paged<ProductComment>(
        "/Comment/GetTreeComments",
        {
          EntityCode: productId,
          EntityComment: "AgriculturalListing",
          PageSize: 100,
        },
        true,
      ),
  });
  const ratingSummary = useQuery({
    queryKey: ["product-rating-summary", productId],
    queryFn: () =>
      request<ProductRatingSummary>("/Comment/GetRatingSummary", {
        params: { entityCode: productId, entityComment: "AgriculturalListing" },
      }),
    enabled: !!productId,
  });
  const myReview = useQuery({
    queryKey: ["my-product-review", productId],
    queryFn: () =>
      request<OwnProductReview | null>("/Comment/GetMyProductReview", {
        params: { entityCode: productId, entityComment: "AgriculturalListing" },
      }),
    enabled: !!productId && !!Cookies.get("token"),
  });
  const similar = useQuery({
    queryKey: ["platform", "similar-products", productId],
    queryFn: () =>
      paged<StoreProduct>(
        "/AgriculturalListing/GetSimilar",
        { ProductCode: productId, PageNumber: 1, PageSize: 4 },
        true,
      ),
  });
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState(0);
  const [commentOpen, setCommentOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const item = query.data;
  const averageRating = ratingSummary.data?.averageRating ?? 0;
  const ratingCount = ratingSummary.data?.ratingCount ?? 0;
  const farm = useQuery({
    queryKey: ["platform", "farm-contact", item?.farmCode],
    queryFn: () =>
      request<ProductFarm>("/Farm/GetByCode", {
        params: { code: item!.farmCode },
      }),
    enabled: !!item?.farmCode,
  });
  const inquiry = useMutation({
    mutationFn: () => request<ProductInquiry>("/ProductInquiry", {
      method: "POST",
      data: { productCode: productId, quantity },
    }),
    onSuccess: (created) => {
      toast.success(`درخواست خرید با کد ${created.code} ثبت شد؛ حالا با فروشنده هماهنگ کنید.`);
      void queryClient.invalidateQueries({ queryKey: ["product-inquiries"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const images = item?.imageUrls?.length
    ? item.imageUrls
    : [item?.primaryImageUrl || "/placeholder.svg"];
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <Link
        href="/product"
        className="mb-5 inline-block text-sm text-emerald-700"
      >
        محصولات / جزئیات محصول
      </Link>
      <QueryState
        loading={query.isPending}
        error={query.error}
        empty={!item}
        retry={() => query.refetch()}
        emptyText="این محصول پیدا نشد"
        skeleton="detail"
      >
        {item && (
          <>
            <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-8">
              <section className="rounded-3xl border border-slate-100 bg-white p-3 shadow-sm sm:p-5 lg:sticky lg:top-24">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-emerald-50 sm:aspect-square">
                  <Image
                    src={getImageUrl(images[selected] || images[0])}
                    alt={item.name}
                    fill
                    sizes="(max-width: 1024px) 95vw, 50vw"
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                </div>
                {images.length > 1 && (
                  <div className="mt-4 flex gap-3 overflow-x-auto">
                    {images.map((url, index) => (
                      <button
                        type="button"
                        key={`${url}-${index}`}
                        aria-label={`تصویر ${index + 1}`}
                        aria-pressed={selected === index}
                        onClick={() => setSelected(index)}
                        className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${selected === index ? "border-emerald-600" : "border-transparent"}`}
                      >
                        <Image
                          src={getImageUrl(url)}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>
              <section className="min-w-0 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-8">
                <h1 className="mb-5 text-2xl font-bold leading-10 text-slate-800">
                  {item.name}
                </h1>
                <div className="mb-4 flex items-center gap-2" aria-label={averageRating ? `امتیاز ${averageRating.toFixed(1)} از ۵ بر اساس ${ratingCount} نظر` : "هنوز امتیازی ثبت نشده است"}>
                  <span className="text-xl tracking-wide text-amber-400" dir="ltr">{[1, 2, 3, 4, 5].map((star) => <span key={star}>{star <= Math.round(averageRating) ? "★" : "☆"}</span>)}</span>
                  <span className="text-sm text-slate-600">{averageRating ? `${averageRating.toFixed(1)} از ۵ (${faNumber(ratingCount)} امتیاز)` : "بدون امتیاز"}</span>
                </div>
                <div className="mb-3 text-3xl">
                  <ProductPrice retailPrice={item.retailPrice} saleUnit={item.saleUnit} />
                </div>
                <div className="mb-7 flex flex-wrap items-center justify-end gap-2">
                  <p className="me-auto basis-full text-xs text-slate-400 sm:basis-auto">
                    موجودی: {faNumber(item.stock)} {saleUnitLabel(item.saleUnit)}
                  </p>
                  <ProductReportForm key={item.code} code={item.code} />
                  <SaveProductButton code={item.code} iconOnly />
                </div>
                <SafeArticleContent
                  content={
                    item.description || "توضیحی برای این محصول ثبت نشده است."
                  }
                />
                <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5" data-product-inquiry>
                  <div className="mb-4"><h2 className="text-base font-bold text-emerald-900">درخواست خرید مستقیم</h2><p className="mt-1 text-xs leading-6 text-emerald-900/75">این درخواست فقط یک پیش‌فاکتور برای هماهنگی شما و کشاورز است؛ پرداخت و ارسال آنلاین ندارد.</p></div>
                  <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex shrink-0 items-center rounded-xl border border-slate-200">
                    <button type="button" aria-label="افزایش تعداد" disabled={quantity >= item.stock} onClick={() => setQuantity(q => q + 1)} className="flex h-11 w-11 items-center justify-center text-emerald-700 disabled:opacity-35"><Plus className="h-4 w-4" /></button>
                    <input
                      aria-label="مقدار خرید"
                      aria-describedby={item.stock > 0 && (quantity > item.stock || quantity < 1) ? "purchase-quantity-help" : undefined}
                      inputMode="numeric"
                      maxLength={10}
                      disabled={item.stock <= 0}
                      value={quantity || ""}
                      onFocus={e => e.target.select()}
                      onChange={e => {
                        const raw = saleDigits(e.target.value);
                        if (/^\d*$/.test(raw)) setQuantity(Number(raw));
                      }}
                      className="w-24 min-w-0 bg-transparent p-2 text-center text-sm font-bold"
                    />
                    <span className="px-1 text-xs">{saleUnitLabel(item.saleUnit)}</span>
                    <button type="button" aria-label="کاهش تعداد" disabled={item.stock <= 0 || quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))} className="flex h-11 w-11 items-center justify-center text-emerald-700 disabled:opacity-35"><Minus className="h-4 w-4" /></button>
                  </div>
                  <ActionButton
                    className="flex-1 px-2 text-xs sm:flex-none sm:px-4"
                    busy={inquiry.isPending}
                    disabled={item.stock <= 0 || quantity < 1 || !Number.isSafeInteger(quantity) || quantity > item.stock}
                    onClick={() => Cookies.get("token") ? inquiry.mutate() : toast.error("برای ثبت درخواست خرید ابتدا وارد حساب کاربری شوید.")}
                  >
                    <Send className="h-4 w-4" />{item.stock <= 0 ? "ناموجود" : "ثبت درخواست خرید"}
                  </ActionButton>
                </div>
                {inquiry.isSuccess && <Link href="/dashboard/inquiries" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 underline">دیدن درخواست ثبت‌شده</Link>}
                </div>
                {item.stock > 0 && (quantity > item.stock || quantity < 1) && <p id="purchase-quantity-help" className="mt-2 text-xs leading-6 text-red-700">
                  {quantity > item.stock && " مقدار انتخابی بیشتر از موجودی است."}
                  {quantity < 1 && " حداقل مقدار خرید ۱ است."}
                </p>}
                <ListingSpecifications typeName={item.productTemplateName} specifications={item.specifications} />
                <div className="mt-6 rounded-2xl border border-emerald-100 bg-gradient-to-l from-emerald-50/80 to-white p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-700">
                    <BuildingStorefrontIcon className="h-5 w-5 text-emerald-700" />
                    مزرعه و فروشنده
                  </div>
                  {farm.isLoading ? (
                    <div className="flex items-center gap-3" role="status" aria-label="در حال دریافت اطلاعات مزرعه">
                      <SkeletonBlock className="h-12 w-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <SkeletonBlock className="h-4 w-1/2" />
                        <SkeletonBlock className="h-3 w-2/3" />
                      </div>
                    </div>
                  ) : farm.data ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-emerald-100">
                          {farm.data.imageUrl && (
                            <Image
                              src={getImageUrl(farm.data.imageUrl)}
                              alt={farm.data.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">
                            {farm.data.name}
                          </p>
                          <p className="mt-1 flex items-start gap-1 text-xs leading-5 text-slate-500">
                            <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
                            <span className="min-w-0 break-words">
                              {[
                                farm.data.address?.provinceName && `استان ${farm.data.address.provinceName}`,
                                farm.data.address?.countyName && `شهرستان ${farm.data.address.countyName}`,
                              ]
                                .filter(Boolean)
                                .join("، ") || "موقعیت ثبت‌نشده"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        {farm.data.ownerCode && (
                          <ChatRoomLink
                            receiverCode={farm.data.ownerCode}
                            contextName={item.name}
                            contextType="محصول"
                            selfContactHint="این آگهی برای مزرعهٔ خودتان است. خریداران می‌توانند از این دکمه به شما پیام بدهند."
                            className="inline-flex min-h-11 flex-auto items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition enabled:hover:bg-emerald-800 disabled:bg-slate-100 disabled:text-slate-600 sm:flex-none"
                          >
                            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                            گفت‌وگو با فروشنده
                          </ChatRoomLink>
                        )}
                        <Link
                          href={publicDetailPath("farm", item.farmCode || "", farm.data?.name)}
                          className="inline-flex min-h-11 flex-auto items-center justify-center rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50 sm:flex-none"
                        >
                          صفحه مزرعه
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">اطلاعات مزرعه در دسترس نیست.</p>
                  )}
                </div>
              </section>
            </div>
            <section className="my-8 rounded-3xl border border-slate-100 bg-white p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">دیدگاه کاربران</h2>
                <ActionButton
                  variant="secondary"
                  onClick={() => setCommentOpen(true)}
                >
                  {myReview.data ? "ویرایش دیدگاه من" : "ثبت دیدگاه"}
                </ActionButton>
              </div>
              <QueryState
                loading={comments.isLoading}
                error={comments.error}
                empty={!comments.data?.items.length}
                retry={() => comments.refetch()}
                emptyText="هنوز دیدگاهی برای این محصول منتشر نشده است"
                skeleton="rows"
              >
                <div className="space-y-6">
                  {comments.data?.items.map((comment) => (
                    <article
                      key={comment.code}
                      className="space-y-3"
                    >
                      <div className="rounded-2xl bg-slate-100 p-4 sm:p-5">
                        <p className="mb-2 text-xs font-bold text-slate-500">
                          {comment.name || comment.userFullName ||
                            comment.userName ||
                            "کاربر الو گیاه"}
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {comment.content}
                        </p>
                        {comment.rating && <p className="mt-3 text-sm tracking-wide text-amber-500" aria-label={`امتیاز ${comment.rating} از ۵`} dir="ltr">{"★".repeat(comment.rating)}{"☆".repeat(5 - comment.rating)}</p>}
                        <button type="button" disabled={myReview.isLoading} className="mt-3 text-xs font-semibold text-emerald-700 transition hover:text-emerald-900 disabled:opacity-50" onClick={() => { setReplyTo(myReview.data?.code === comment.code ? null : comment.code); setCommentOpen(true); }}>
                          {myReview.isLoading ? "..." : myReview.data?.code === comment.code ? "ویرایش دیدگاه من" : "پاسخ به دیدگاه"}
                        </button>
                      </div>
                      {(comment.subComments || comment.replies)?.map(
                        (reply) => (
                          <div
                            key={reply.code}
                            className="relative mr-7 rounded-2xl border border-emerald-300 bg-white p-4 sm:mr-10 sm:p-5"
                          >
                            <span className="absolute -right-7 top-0 h-5 w-7 rounded-br-xl border-b border-r border-emerald-300" aria-hidden="true" />
                            <p className="mb-2 text-xs font-bold text-emerald-700">
                              {reply.name || reply.userFullName || reply.userName || "فروشگاه"}
                            </p>
                            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                              {reply.content}
                            </p>
                            {reply.rating && <p className="mt-3 text-sm tracking-wide text-amber-500" aria-label={`امتیاز ${reply.rating} از ۵`} dir="ltr">{"★".repeat(reply.rating)}{"☆".repeat(5 - reply.rating)}</p>}
                            <button type="button" className="mt-3 text-xs font-semibold text-emerald-700 transition hover:text-emerald-900" onClick={() => { setReplyTo(reply.code); setCommentOpen(true); }}>
                              پاسخ به دیدگاه
                            </button>
                          </div>
                        ),
                      )}
                    </article>
                  ))}
                </div>
              </QueryState>
            </section>
            <section>
              <h2 className="mb-5 text-xl font-bold">محصولات مشابه و پیشنهادی</h2>
              <QueryState
                loading={similar.isLoading}
                error={similar.error}
                retry={() => similar.refetch()}
                skeleton="products"
              >
                {similar.data?.items.length ? <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {similar.data?.items.map((p) => (
                    <StoreProductCard product={p} key={p.code} />
                  ))}
                </div> : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
                    <p className="text-sm text-slate-600">فعلاً آگهی دیگری برای پیشنهاد وجود ندارد.</p>
                    <Link href="/product" className="mt-3 inline-flex min-h-11 items-center font-bold text-emerald-800">مشاهدهٔ همهٔ آگهی‌ها</Link>
                  </div>
                )}
              </QueryState>
            </section>
          </>
        )}
      </QueryState>
      <FormPanel
        open={commentOpen}
        onClose={() => {
          setCommentOpen(false);
          setReplyTo(null);
          comments.refetch();
        }}
        title={replyTo ? "پاسخ به دیدگاه" : "ثبت دیدگاه"}
        placement="bottom"
      >
        <AddCommentForm key={replyTo || "new-comment"} productID={productId} parentCode={replyTo} />
      </FormPanel>
    </div>
  );
}
