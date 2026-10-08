"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { BuildingStorefrontIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { request, paged, errorMessage } from "@/lib/actions/platform";
import type { StoreProduct } from "@/shared/types/platform";
import { faNumber } from "@/shared/utils/platform";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import useCart from "@/hooks/mutations/useCart";
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
    cityName?: string;
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
export default function ProductDetail({ productId }: { productId: string }) {
  const query = useQuery({
    queryKey: ["platform", "product", productId],
    queryFn: () =>
      request<StoreProduct>("/AgriculturalProduct/GetByCode", {
        params: { code: productId },
      }),
    enabled: !!productId,
  });
  const comments = useQuery({
    queryKey: ["getCommentsTree", productId],
    queryFn: () =>
      paged<ProductComment>(
        "/Comment/GetTreeComments",
        {
          EntityCode: productId,
          EntityComment: "AgriculturalProduct",
          PageSize: 100,
        },
        true,
      ),
  });
  const ratingSummary = useQuery({
    queryKey: ["product-rating-summary", productId],
    queryFn: () =>
      request<ProductRatingSummary>("/Comment/GetRatingSummary", {
        params: { entityCode: productId, entityComment: "AgriculturalProduct" },
      }),
    enabled: !!productId,
  });
  const myReview = useQuery({
    queryKey: ["my-product-review", productId],
    queryFn: () =>
      request<OwnProductReview | null>("/Comment/GetMyProductReview", {
        params: { entityCode: productId, entityComment: "AgriculturalProduct" },
      }),
    enabled: !!productId && !!Cookies.get("token"),
  });
  const similar = useQuery({
    queryKey: ["platform", "similar-products", productId],
    queryFn: () =>
      paged<StoreProduct>(
        "/AgriculturalProduct/GetSimilar",
        { ProductCode: productId, PageNumber: 1, PageSize: 4 },
        true,
      ),
  });
  const { addCart } = useCart();
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
        loading={query.isLoading}
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
                <p className="mb-4 text-xs text-slate-400">
                  موجودی: {faNumber(item.stock)}
                </p>
                <div className="mb-7 text-3xl">
                  <ProductPrice retailPrice={item.retailPrice} wholesalePrice={item.wholesalePrice} />
                </div>
                <SafeArticleContent
                  content={
                    item.description || "توضیحی برای این محصول ثبت نشده است."
                  }
                />
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <ActionButton
                    variant="secondary"
                    aria-label="کاهش تعداد"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </ActionButton>
                  <span>{faNumber(quantity)}</span>
                  <ActionButton
                    variant="secondary"
                    aria-label="افزایش تعداد"
                    disabled={quantity >= item.stock}
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </ActionButton>
                  <ActionButton
                    busy={addCart.isPending}
                    disabled={item.stock <= 0 || quantity > item.stock}
                    onClick={() =>
                      addCart.mutate(
                        { productCode: item.code, quantity },
                        {
                          onSuccess: () =>
                            toast.success("محصول به سبد خرید اضافه شد"),
                          onError: (e) => toast.error(errorMessage(e)),
                        },
                      )
                    }
                  >
                    افزودن به سبد خرید
                  </ActionButton>
                </div>
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
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                            <span className="truncate">
                              {[farm.data.address?.provinceName, farm.data.address?.countyName, farm.data.address?.cityName]
                                .filter(Boolean)
                                .join("، ") || "موقعیت ثبت‌نشده"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Link
                          href={`/farm/${encodeURIComponent(item.farmCode || "")}`}
                          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100 transition hover:bg-emerald-50"
                        >
                          صفحه مزرعه
                        </Link>
                        {farm.data.ownerCode && (
                          <ChatRoomLink
                            receiverCode={farm.data.ownerCode}
                            contextName={item.name}
                            contextType="محصول"
                            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800"
                          >
                            گفت‌وگو با فروشنده
                          </ChatRoomLink>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">اطلاعات مزرعه در دسترس نیست.</p>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                  <Link
                    href={`/dashboard/quality?product=${encodeURIComponent(item.code)}`}
                    className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700"
                  >
                    گزارش کیفیت / کارشناسی
                  </Link>
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
                  ثبت یا ویرایش دیدگاه
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
                <div className="space-y-4">
                  {comments.data?.items.map((comment) => (
                    <article
                      key={comment.code}
                      className="rounded-2xl bg-slate-50 p-4"
                    >
                      <p className="mb-2 text-xs font-bold text-slate-500">
                        {comment.name || comment.userFullName ||
                          comment.userName ||
                          "کاربر الو گیاه"}
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {comment.content}
                      </p>
                      {comment.rating && <p className="my-2 text-sm tracking-wide text-amber-500" aria-label={`امتیاز ${comment.rating} از ۵`} dir="ltr">{"★".repeat(comment.rating)}{"☆".repeat(5 - comment.rating)}</p>}
                      <button type="button" disabled={myReview.isLoading} className="mt-2 text-xs font-semibold text-emerald-700 disabled:opacity-50" onClick={() => { setReplyTo(myReview.data?.code === comment.code ? null : comment.code); setCommentOpen(true); }}>
                        {myReview.isLoading ? "..." : myReview.data?.code === comment.code ? "ویرایش دیدگاه" : "پاسخ به دیدگاه"}
                      </button>
                      {(comment.subComments || comment.replies)?.map(
                        (reply) => (
                          <p
                            key={reply.code}
                            className="mt-3 border-r-2 border-emerald-200 pr-3 text-sm leading-7 text-slate-600"
                          >
                            <>{reply.content}{reply.rating && <span className="mr-2 text-amber-500" dir="ltr">{"★".repeat(reply.rating)}</span>}</>
                          </p>
                        ),
                      )}
                    </article>
                  ))}
                </div>
              </QueryState>
            </section>
            <section>
              <h2 className="mb-5 text-xl font-bold">محصولات مشابه</h2>
              <QueryState
                loading={similar.isLoading}
                error={similar.error}
                empty={!similar.data?.items.length}
                retry={() => similar.refetch()}
                skeleton="products"
              >
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {similar.data?.items.map((p) => (
                    <StoreProductCard product={p} key={p.code} />
                  ))}
                </div>
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
      >
        <AddCommentForm key={replyTo || "new-comment"} productID={productId} parentCode={replyTo} />
      </FormPanel>
    </div>
  );
}
