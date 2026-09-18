"use client";

import Button from "@/design-system/atoms/Button";
import { useCommentsTree } from "@/hooks/queries/useComments";
import { useProduct, useSimilarProduct } from "@/hooks/queries/useProduct";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import { useState } from "react";
import Modal from "./Modal";
import AddCommentForm from "../Home/AddCommentForm";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  CubeIcon,
  GiftIcon,
  HeartIcon,
  InformationCircleIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SparklesIcon,
  StarIcon,
  TruckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { CommentCard } from "./CommentCard";
import Link from "next/link";
import SimilarProducts from "./SimilarProducts";

type ProductImage = {
  id: number;
  url: string;
};

type RelatedProduct = {
  id: number;
  name: string;
  price: string;
  image: string;
};

type Comment = {
  code: string;
  name: string;
  content: string;
  createdAt: string;
  subComments?: Comment[];
};

const ProductDetail = ({ productId }: { productId: string }) => {
  const { product } = useProduct(productId);
  const { data: comments } = useCommentsTree();

  const apiProduct = product.data ?? {};

  // farmCode
  const { similarProduct } = useSimilarProduct({
    ProductCode: productId,
    PageNumber: 1,
    PageSize: 15,
    SortColumn: "ksajd",
    SortDescending: true,
  });

  console.log(similarProduct);
  /*
   * ---------------------------------------------------------
   * Hard coded data
   * هرجایی که API دیتا نداره از این اطلاعات استفاده می‌کنیم
   * ---------------------------------------------------------
   */

  const hardCodedImages: ProductImage[] = [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=1400&q=90",
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1546470427-e5ac89c8ba8d?auto=format&fit=crop&w=600&q=90",
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=90",
    },
    {
      id: 4,
      url: "https://images.unsplash.com/photo-1582284540020-8acbe03f4924?auto=format&fit=crop&w=600&q=90",
    },
    {
      id: 5,
      url: "https://images.unsplash.com/photo-1599639957043-f3aa5c986398?auto=format&fit=crop&w=600&q=90",
    },
    {
      id: 6,
      url: "https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=600&q=90",
    },
  ];

  const relatedProducts: RelatedProduct[] = [
    {
      id: 1,
      name: "خیار سبز ارگانیک",
      price: "۲۸,۰۰۰",
      image:
        "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=500&q=85",
    },
    {
      id: 2,
      name: "کاهو رسمی ارگانیک",
      price: "۲۲,۰۰۰",
      image:
        "https://images.unsplash.com/photo-1622205313162-be1d5712a43f?auto=format&fit=crop&w=500&q=85",
    },
    {
      id: 3,
      name: "فلفل دلمه‌ای رنگی",
      price: "۴۸,۰۰۰",
      image:
        "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=500&q=85",
    },
    {
      id: 4,
      name: "گوجه گیلاسی ارگانیک",
      price: "۳۵,۰۰۰",
      image:
        "https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=500&q=85",
    },
  ];

  const hardCodedComments: Comment[] = [
    {
      code: "comment-1",
      name: "علی محمدی",
      content: "گوجه خیلی تازه و با کیفیت بود. طعم طبیعی و فوق‌العاده‌ای داشت.",
      createdAt: "2024-03-20",
      subComments: [
        {
          code: "reply-1",
          name: "خلفونه مزرعه",
          content: "ممنون از نظر شما. خوشحالیم که از کیفیت محصول راضی بودید.",
          createdAt: "2024-03-21",
        },
      ],
    },
    {
      code: "comment-2",
      name: "سارا احمدی",
      content: "بسته‌بندی خیلی خوب بود و محصول کاملاً سالم به دستم رسید.",
      createdAt: "2024-03-18",
      subComments: [],
    },
    {
      code: "comment-3",
      name: "رضا کریمی",
      content: "طعم گوجه واقعاً عالی بود و مشخصه محصول تازه است.",
      createdAt: "2024-03-15",
      subComments: [],
    },
  ];

  /*
   * ---------------------------------------------------------
   * Product data
   * ---------------------------------------------------------
   */

  const productName = apiProduct.name || "گوجه فرنگی ارگانیک";

  const productDescription =
    apiProduct.description ||
    "گوجه فرنگی ارگانیک تازه و سالم، محصول مزرعه بهار سبز بدون استفاده از سموم شیمیایی و کودهای مصنوعی، با طعمی طبیعی و دلپذیر.";

  const retailPrice = apiProduct.retailPrice || "۴۵,۰۰۰";

  const wholesalePrice = apiProduct.wholesalePrice || "۸۰,۰۰۰";

  const apiImage = apiProduct.primaryImageUrl
    ? getImageUrl(apiProduct.primaryImageUrl)
    : null;

  const images = apiImage
    ? [
        {
          id: 1,
          url: apiImage,
        },
        ...hardCodedImages.slice(1),
      ]
    : hardCodedImages;

  /*
   * ---------------------------------------------------------
   * States
   * ---------------------------------------------------------
   */

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [openCommentForm, setOpenCommentForm] = useState(false);
  const [parentCode, setParentCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("description");

  /*
   * ---------------------------------------------------------
   * Comments
   * ---------------------------------------------------------
   */

  const finalComments =
    comments && comments.length > 0
      ? (comments as Comment[])
      : hardCodedComments;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fa-IR");
  };

  /*
   * ---------------------------------------------------------
   * Quantity
   * ---------------------------------------------------------
   */

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  /*
   * ---------------------------------------------------------
   * Main UI
   * ---------------------------------------------------------
   */

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f8f7] text-gray-800">
      <main className="mx-auto max-w-[1350px] px-4 py-6 md:px-6">
        {/* Breadcrumb */}

        <div className="mb-5 flex items-center justify-end gap-3 text-xs text-gray-400">
          <span>خانه</span>
          <span>‹</span>
          <span>محصولات</span>
          <span>‹</span>
          <span>سبزیجات</span>
          <span>‹</span>
          <span className="text-gray-700">گوجه فرنگی ارگانیک</span>
        </div>

        {/* =================================================
            PRODUCT TOP
        ================================================== */}

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.05fr_1fr]">
          {/* =================================================
              PRODUCT INFO
          ================================================== */}

          <div className="order-2 rounded-2xl bg-white p-6 shadow-sm lg:order-1">
            {/* Product category */}

            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-4 py-2 text-xs font-medium text-green-700">
                {/* <LeafIcon className="h-4 w-4" /> */}
                ارگانیک
              </span>

              <span className="text-xs text-gray-400">محصول تازه</span>
            </div>

            {/* Title */}

            <h1 className="text-3xl font-bold leading-relaxed text-gray-900">
              {productName}
            </h1>

            {/* Rating */}

            <div className="mt-3 flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((item) => (
                  <StarIcon
                    key={item}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <span className="text-sm font-medium text-gray-700">۴.۸</span>

              <span className="text-xs text-gray-400">(۱۲۸ نظر)</span>
            </div>

            {/* Description */}

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3 text-sm leading-7 text-gray-600">
                {/* <LeafIcon className="mt-1 h-5 w-5 shrink-0 text-green-600" /> */}

                <span>
                  گوجه فرنگی تازه و ارگانیک مزرعه بهار سبز، بدون استفاده از سموم
                  شیمیایی و کودهای مصنوعی، با طعمی طبیعی و دلپذیر.
                </span>
              </div>

              <div className="flex items-start gap-3 text-sm leading-7 text-gray-600">
                <SparklesIcon className="mt-1 h-5 w-5 shrink-0 text-green-600" />

                <span>
                  مناسب برای مصرف روزانه و تهیه انواع سالاد، غذا و سس.
                </span>
              </div>
            </div>

            <div className="my-6 h-px bg-gray-100" />

            {/* Price */}

            <div className="flex items-end justify-between">
              <div>
                <span className="text-3xl font-bold text-green-700">
                  {retailPrice}
                </span>

                <span className="mr-2 text-sm text-gray-500">تومان</span>

                <div className="mt-1 text-xs text-gray-400">هر کیلوگرم</div>
              </div>

              {/* Quantity */}

              <div className="flex items-center overflow-hidden rounded-xl border border-gray-200">
                <button
                  onClick={decreaseQuantity}
                  className="flex h-11 w-11 items-center justify-center transition hover:bg-gray-50"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>

                <span className="flex h-11 w-12 items-center justify-center border-x border-gray-200 text-sm font-medium">
                  {quantity}
                </span>

                <button
                  onClick={increaseQuantity}
                  className="flex h-11 w-11 items-center justify-center transition hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Add cart */}

            <div className="mt-5 flex gap-3">
              <Button
                variant="secondary"
                className="flex h-12 flex-1 items-center justify-center gap-2 !rounded-xl bg-green-600 text-white hover:bg-green-700"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                افزودن به سبد خرید
              </Button>

              <button
                onClick={() => setLiked((prev) => !prev)}
                className={`flex h-12 w-14 items-center justify-center rounded-xl border transition ${
                  liked
                    ? "border-red-200 bg-red-50 text-red-500"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <HeartIcon
                  className={`h-6 w-6 ${liked ? "fill-red-500" : ""}`}
                />
              </button>
            </div>

            {/* Features */}

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#f8faf8] p-3 md:grid-cols-4">
              <div className="flex flex-col items-center gap-2 p-2 text-center">
                <TruckIcon className="h-6 w-6 text-green-600" />

                <span className="text-xs font-medium">ارسال سریع</span>

                <span className="text-[10px] text-gray-400">
                  ۳ تا ۵ روز کاری
                </span>
              </div>

              <div className="flex flex-col items-center gap-2 p-2 text-center">
                <ShieldCheckIcon className="h-6 w-6 text-green-600" />

                <span className="text-xs font-medium">ضمانت کیفیت</span>

                <span className="text-[10px] text-gray-400">
                  ۷ روز ضمانت برگشت
                </span>
              </div>

              <div className="flex flex-col items-center gap-2 p-2 text-center">
                {/* <LeafIcon className="h-6 w-6 text-green-600" /> */}

                <span className="text-xs font-medium">۱۰۰٪ ارگانیک</span>

                <span className="text-[10px] text-gray-400">
                  بدون سم و کود شیمیایی
                </span>
              </div>

              <div className="flex flex-col items-center gap-2 p-2 text-center">
                <GiftIcon className="h-6 w-6 text-green-600" />

                <span className="text-xs font-medium">بسته‌بندی استاندارد</span>

                <span className="text-[10px] text-gray-400">
                  حفظ تازگی محصول
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              IMAGE GALLERY
          ================================================== */}

          <div className="order-1 rounded-2xl bg-white p-4 shadow-sm lg:order-2">
            {/* Main image */}

            <div className="relative h-[420px] overflow-hidden rounded-2xl bg-gray-100">
              <img
                src={images[selectedImage]?.url}
                alt={productName}
                className="h-full w-full object-cover"
              />

              {/* New product */}

              <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/95 px-4 py-2 text-xs font-medium text-green-700 shadow-sm">
                {/* <LeafIcon className="h-4 w-4" /> */}
                محصول تازه
              </div>

              {/* Previous */}

              <button
                onClick={() =>
                  setSelectedImage((prev) =>
                    prev === 0 ? images.length - 1 : prev - 1,
                  )
                }
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-105"
              >
                <ArrowRightIcon className="h-5 w-5" />
              </button>

              {/* Next */}

              <button
                onClick={() =>
                  setSelectedImage((prev) =>
                    prev === images.length - 1 ? 0 : prev + 1,
                  )
                }
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-105"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Thumbnails */}

            <div className="mt-3 grid grid-cols-5 gap-3">
              {images.slice(0, 5).map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`relative h-20 overflow-hidden rounded-xl border-2 transition ${
                    selectedImage === index
                      ? "border-green-600"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`${productName}-${index}`}
                    className="h-full w-full object-cover"
                  />

                  {selectedImage === index && (
                    <div className="absolute inset-0 bg-green-600/10" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =================================================
            LOWER SECTION
        ================================================== */}

        <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.65fr_1fr]">
          {/* =================================================
              DESCRIPTION / FEATURES
          ================================================== */}

          <div className="rounded-2xl bg-white shadow-sm">
            {/* Tabs */}

            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab("description")}
                className={`flex-1 px-5 py-5 text-sm font-medium transition ${
                  activeTab === "description"
                    ? "border-b-2 border-green-600 text-green-700"
                    : "text-gray-500"
                }`}
              >
                توضیحات
              </button>

              <button
                onClick={() => setActiveTab("features")}
                className={`flex-1 px-5 py-5 text-sm font-medium transition ${
                  activeTab === "features"
                    ? "border-b-2 border-green-600 text-green-700"
                    : "text-gray-500"
                }`}
              >
                ویژگی‌ها
              </button>

              <button
                onClick={() => setActiveTab("reviews")}
                className={`flex-1 px-5 py-5 text-sm font-medium transition ${
                  activeTab === "reviews"
                    ? "border-b-2 border-green-600 text-green-700"
                    : "text-gray-500"
                }`}
              >
                نظرات کاربران (۱۲۸)
              </button>
            </div>

            {/* Tab content */}

            <div className="p-6">
              {activeTab === "description" && (
                <>
                  <p className="text-sm leading-8 text-gray-600">
                    {productDescription}
                  </p>

                  <p className="mt-3 text-sm leading-8 text-gray-600">
                    این محصول در محیطی سالم و با بهره‌گیری از روش‌های کشاورزی
                    پایدار کشت می‌شود. گوجه فرنگی‌ها پس از برداشت، در کوتاه‌ترین
                    زمان ممکن بسته‌بندی شده و برای مشتری ارسال می‌شوند.
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {[
                      "سرشار از ویتامین C و لیکوپن",
                      "بدون استفاده از سموم شیمیایی",
                      "کشت در محیط کنترل شده",
                      "طعم طبیعی و دلپذیر",
                      "مناسب برای سالاد و پخت و پز",
                      "محصول سالم برای خانواده",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-xl border border-gray-100 px-4 py-3 text-xs"
                      >
                        <CheckCircleIcon className="h-5 w-5 shrink-0 text-green-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === "features" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FeatureRow title="نوع محصول" value="گوجه فرنگی ارگانیک" />

                  <FeatureRow title="وزن" value="۱ کیلوگرم" />

                  <FeatureRow title="نوع کشت" value="ارگانیک" />

                  <FeatureRow title="محل کشت" value="مزرعه بهار سبز - شیراز" />

                  <FeatureRow title="تاریخ برداشت" value="۱۴۰۳/۰۳/۲۰" />

                  <FeatureRow title="ماندگاری" value="۷ روز در یخچال" />
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-4">
                  {finalComments.map((comment) => (
                    <CommentCard
                      key={comment.code}
                      comment={comment}
                      formatDate={formatDate}
                      onReply={() => {
                        setParentCode(comment.code);
                        setOpenCommentForm(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              PRODUCT INFORMATION
          ================================================== */}

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <InformationCircleIcon className="h-5 w-5 text-green-600" />

              <h2 className="font-semibold">اطلاعات محصول</h2>
            </div>

            <div className="divide-y divide-gray-100">
              <InfoRow
                icon={<CubeIcon className="h-5 w-5" />}
                title="دسته‌بندی"
                value="سبزیجات"
              />

              <InfoRow
                icon={<ShoppingCartIcon className="h-5 w-5" />}
                title="وزن محصول"
                value="۱ کیلوگرم"
              />

              <InfoRow
                icon={<MapPinIcon className="h-5 w-5" />}
                title="محل کشت"
                value="مزرعه بهار سبز - شیراز"
              />

              <InfoRow
                icon={<MapPinIcon className="h-5 w-5" />}
                title="نوع کشت"
                value="ارگانیک"
              />

              <InfoRow
                icon={<CalendarDaysIcon className="h-5 w-5" />}
                title="تاریخ برداشت"
                value="۱۴۰۳/۰۳/۲۰"
              />

              <InfoRow
                icon={<ClockIcon className="h-5 w-5" />}
                title="ماندگاری"
                value="۷ روز در یخچال"
              />

              <InfoRow
                icon={<ShieldCheckIcon className="h-5 w-5" />}
                title="شرایط نگهداری"
                value="در دمای ۴ تا ۸ درجه سانتی‌گراد"
              />
            </div>
          </div>
        </section>

        {/* =================================================
            REVIEWS + RELATED PRODUCTS
        ================================================== */}

        <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.65fr]">
          {/* Reviews */}

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">نظرات کاربران</h2>

              <button
                onClick={() => {
                  setParentCode(null);
                  setOpenCommentForm(true);
                }}
                className="text-xs font-medium text-green-600"
              >
                ثبت نظر
              </button>
            </div>

            <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
              <div className="text-4xl font-bold text-gray-800">۴.۸</div>

              <div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <StarIcon
                      key={item}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                <p className="mt-1 text-xs text-gray-400">بر اساس ۱۲۸ نظر</p>
              </div>
            </div>

            <div className="mt-5">
              {finalComments.slice(0, 1).map((comment) => (
                <CommentCard
                  key={comment.code}
                  comment={comment}
                  formatDate={formatDate}
                  onReply={() => {
                    setParentCode(comment.code);
                    setOpenCommentForm(true);
                  }}
                />
              ))}
            </div>

            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-xs text-gray-600 transition hover:bg-gray-50">
              مشاهده همه نظرات
              <ChevronDownIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Related Products */}

          <SimilarProducts
            products={similarProduct?.data ?? []}
            // onAddToCart={(productCode) => {
            //   addCart.mutate(
            //     {
            //       productCode,
            //       quantity: 1,
            //     },
            //     {
            //       onSuccess: (data) => {
            //         toast.success(data?.message);
            //       },
            //       onError: () => {
            //         toast.error("افزودن محصول به سبد خرید انجام نشد");
            //       },
            //     },
            //   );
            // }}
          />
        </section>
      </main>

      {/* =====================================================
          COMMENT MODAL
      ====================================================== */}

      <Modal
        open={openCommentForm}
        onClose={() => setOpenCommentForm(false)}
        title="فرم ارسال کامنت"
      >
        <AddCommentForm productID={productId} parentCode={parentCode} />
      </Modal>
    </div>
  );
};

/* ============================================================
   FEATURE ROW
============================================================ */

const FeatureRow = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
      <span className="text-xs text-gray-400">{title}</span>

      <span className="text-sm font-medium text-gray-700">{value}</span>
    </div>
  );
};

/* ============================================================
   INFO ROW
============================================================ */

const InfoRow = ({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) => {
  return (
    <div className="flex items-center justify-between py-3.5">
      <div className="flex items-center gap-3 text-gray-500">
        {icon}

        <span className="text-xs">{title}</span>
      </div>

      <span className="text-xs font-medium text-gray-700">{value}</span>
    </div>
  );
};

/* ============================================================
   COMMENT CARD
============================================================ */

export default ProductDetail;

// "use client";

// import Button from "@/design-system/atoms/Button";
// import { useCommentsTree } from "@/hooks/queries/useComments";
// import { useProduct } from "@/hooks/queries/useProduct";
// import { getImageUrl } from "@/shared/utils/getImageUrl";
// import {
//   ArrowRightIcon,
//   MinusIcon,
//   PlusIcon,
//   StarIcon,
// } from "@heroicons/react/24/outline";
// import Image from "next/image";
// import { useEffect, useState } from "react";
// import Modal from "./Modal";
// import AddCommentForm from "../Home/AddCommentForm";

// type Review = {
//   id: number;
//   name: string;
//   date: string;
//   text: string;
//   isStoreReply?: boolean;
// };

// const ProductDetail = ({ productId }: { productId: string }) => {
//   const { product, isLoading } = useProduct(productId);
//   const { name, retailPrice, wholesalePrice, description, primaryImageUrl } =
//     product.data ?? {};
//   const { data: comments } = useCommentsTree();
//   const formatDate = (isoDate: string) =>
//     new Date(isoDate).toLocaleDateString("fa-IR");
//   const [openCommentForm, setOpenCommentForm] = useState(false);
//   const [parentCode, setParentCode] = useState<string | null>(null);
//   useEffect(() => {
//     console.log(parentCode);
//   }, [parentCode]);
//   return (
//     <div className="mx-auto max-w-md mb-2 p-2 rounded-lg min-h-screen bg-white">
//       <div className="p-4 flex items-center justify-between">
//         <ArrowRightIcon className="w-4 h-4" />
//       </div>
//       <div className="px-4 ">
//         <div className="relative w-full h-72 bg-gray-500 rounded-2xl">
//           <Image
//             alt={name}
//             src={getImageUrl(primaryImageUrl) ?? ""}
//             fill
//             className="absolute object-cover"
//           />
//           <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
//             <span className="w-2 h-2 bg-white rounded-full opacity-100" />
//             <span className="w-2 h-2 bg-white rounded-full opacity-50" />
//             <span className="w-2 h-2 bg-white rounded-full opacity-50" />
//           </div>
//         </div>
//       </div>
//       <div className="p-4">
//         <div className="flex items-center gap-2 text-sm">
//           <StarIcon className="w-4 h-4" />
//           <span>۴.۸</span>
//           <span className="text-gray-400">(۳۸۸)</span>
//         </div>
//         <Button
//           onClick={() => {
//             setParentCode(null);
//             setOpenCommentForm(true);
//           }}
//         >
//           افزودن کامنت{" "}
//         </Button>
//         <h1 className="mt-2 text-base font-semibold">{name}</h1>

//         <p className="mt-1 text-xs text-gray-400">{description}</p>

//         <div className="mt-4 space-y-1 text-sm">
//           <div className="flex justify-between">
//             <span className="text-gray-400">۵۰۰ گرم</span>
//             <span className="font-semibold">{retailPrice}تومان</span>
//           </div>
//           <div className="flex justify-between">
//             <span className="text-gray-400">۱ کیلوگرم</span>
//             <span className="font-semibold">{wholesalePrice}تومان</span>
//           </div>
//         </div>
//       </div>

//       {/* Quantity */}
//       <div className="px-4 flex items-center gap-3">
//         <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
//           <MinusIcon className="w-4 h-4" />
//         </button>
//         <span>۱</span>
//         <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
//           <PlusIcon className="w-4 h-4" />
//         </button>
//       </div>

//       {/* Reviews */}
//       <div className="p-4 mt-6">
//         <h2 className="font-medium text-sm mb-4">نظرات دیگر کاربران</h2>

//         <div className="space-y-4  ">
//           {comments &&
//             comments?.map((comment: any) => (
//               <div key={comment.code} className="space-y-2">
//                 {/* Comment */}
//                 <div className="max-w-[85%] text-xs p-3 rounded-2xl leading-relaxed bg-gray-100 ml-auto">
//                   <div className="flex items-center justify-between mb-1">
//                     <span className="font-medium">{comment.name}</span>
//                     <span className="text-[10px] text-gray-400">
//                       {formatDate(comment.createdAt)}
//                     </span>
//                   </div>
//                   <p>{comment.content}</p>
//                   <Button
//                     onClick={() => {
//                       setParentCode(comment?.code);
//                       setOpenCommentForm(true);
//                     }}
//                   >
//                     پاسخ
//                   </Button>
//                 </div>

//                 {/* Replies */}
//                 {comment.subComments?.map((reply: any) => (
//                   <div
//                     key={reply.code}
//                     className="max-w-[85%] text-xs p-3 rounded-2xl leading-relaxed bg-emerald-50 mr-auto border border-emerald-200"
//                   >
//                     <div className="flex items-center justify-between mb-1">
//                       <span className="font-medium">{reply.name}</span>
//                       <span className="text-[10px] text-gray-400">
//                         {formatDate(reply.createdAt)}
//                       </span>
//                     </div>
//                     <p>{reply.content}</p>
//                     {/* <Button
//                       onClick={() => {
//                         setParentCode(reply?.code);
//                         setOpenCommentForm(true);
//                       }}
//                     >
//                       پاسخ
//                     </Button> */}
//                   </div>
//                 ))}
//               </div>
//             ))}
//         </div>
//       </div>
//       {/* Add to Cart */}
//       <Button variant="secondary">افزودن به سبد خرید</Button>

//       <Modal
//         open={openCommentForm}
//         onClose={() => setOpenCommentForm(false)}
//         title="فرم ارسال کامنت"
//       >
//         <AddCommentForm productID={productId} parentCode={parentCode} />
//       </Modal>
//     </div>
//   );
// };

// export default ProductDetail;

{
  /* =====================================================
          HEADER
      ====================================================== */
}

{
  /* <header className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex h-[72px] max-w-[1450px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <LeafIcon className="h-8 w-8 text-green-600" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-800">خلفونه مزرعه</h1>

              <p className="text-[10px] text-gray-400">
                محصولات تازه از مزرعه تا سفره
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-10 text-sm text-gray-700 lg:flex">
            <a className="cursor-pointer transition hover:text-green-600">
              خانه
            </a>

            <a className="cursor-pointer transition hover:text-green-600">
              مزارع
            </a>

            <a className="cursor-pointer transition hover:text-green-600">
              محصولات
            </a>

            <a className="cursor-pointer transition hover:text-green-600">
              وبلاگ
            </a>

            <a className="cursor-pointer transition hover:text-green-600">
              درباره ما
            </a>

            <a className="cursor-pointer transition hover:text-green-600">
              تماس با ما
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 transition hover:bg-gray-100">
              <ShoppingCartIcon className="h-6 w-6 text-gray-700" />

              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] text-white">
                ۲
              </span>
            </button>

            <button className="rounded-full p-2 transition hover:bg-gray-100">
              <UserIcon className="h-6 w-6 text-gray-700" />
            </button>

            <Button className="hidden !rounded-xl bg-green-600 px-7 py-3 text-sm md:block">
              بازگشت به فروشگاه
            </Button>
          </div>
        </div>
      </header> */
}

{
  /* =====================================================
          CONTENT
      ====================================================== */
}
