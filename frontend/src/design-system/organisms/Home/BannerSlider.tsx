"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Image from "next/image";
import { ISlider } from "@/shared/types/slider";
import { getImageUrl } from "@/shared/utils/getImageUrl";
import Link from "next/link";

export default function BannerSlider({ slider }: { slider: ISlider[] }) {
  const banners = slider.filter((banner) =>
    banner.imageUrl?.trim() && getImageUrl(banner.imageUrl) !== "/placeholder.svg");

  if (!banners.length) return null;

  return (
    <div className="relative">
    <Swiper
      modules={[Pagination, Autoplay]}
      className="mt-0"
      spaceBetween={10}
      slidesPerView={1}
      autoplay={banners.length > 1 ? {
        delay: 6000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      } : false}
      pagination={banners.length > 1}
      loop={banners.length > 1}
    >
      {banners.map((banner: ISlider, index) => {
        const image = <Image
          src={getImageUrl(banner.imageUrl)}
          alt={banner.description || ""}
          priority={index === 0}
          fill
          sizes="100vw"
          quality={90}
          className="object-cover object-center"
        />;
        return (
        <SwiperSlide key={banner?.code} className="">
          {banner.linkUrl ? (
            <Link href={banner.linkUrl} className="block aspect-[21/9] w-full relative">{image}</Link>
          ) : (
            <div className="aspect-[21/9] w-full relative">{image}</div>
          )}
        </SwiperSlide>
        );
      })}
    </Swiper>

    </div>
  );
}
