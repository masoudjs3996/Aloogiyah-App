"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Image from "next/image";
import { ISlider } from "@/shared/types/slider";
import { getImageUrl } from "@/shared/utils/getImageUrl";

export default function BannerSlider({ slider }: { slider: ISlider[] }) {
  return (
    <Swiper
      modules={[Pagination, Autoplay]}
      className=" mt-9 md:mt-20"
      spaceBetween={10}
      slidesPerView={1}
      autoplay={{
        delay: 2500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      }}
      pagination={true}
      loop={true}
    >
      {slider?.map((banner: ISlider) => (
        <SwiperSlide key={banner?.code} className="">
          <div className="aspect-[16/11]  w-full md:aspect-[21/9] relative">
            <Image
              src={getImageUrl(banner?.imageUrl)}
              alt={banner?.description}
              priority={banner.order === 1}
              fill
              sizes="100vw"
              quality={90}
              className="object-cover object-center "
            />
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
