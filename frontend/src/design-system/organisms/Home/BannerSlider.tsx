"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Image from "next/image";
import { useEffect } from "react";
import { getSlider } from "@/lib/actions/slider";
import { ISlider } from "@/shared/types/slider";

export default function BannerSlider({ slider }: { slider: ISlider[] }) {
  useEffect(() => {
    console.log(slider);
  }, []);
  const BANNER_IMAGES = [
    {
      id: 1,
      src: "/images/banner/hero-1.jpg",
      description: "بنر تبلیغاتی برای محصول کشاورزی",
    },
    {
      id: 2,
      src: "/images/banner/hero-2.jpg",
      description: "بنر تبلیغاتی برای محصول کشاورزی",
    },
    {
      id: 3,
      src: "/images/banner/hero-3.jpg",
      description: "بنر تبلیغاتی برای محصول کشاورزی",
    },
  ];
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
      {BANNER_IMAGES.map((banner) => (
        <SwiperSlide key={banner.id} className="">
          <div className="aspect-[16/11]  w-full md:aspect-[21/9] relative">
            <Image
              src={banner.src}
              alt={banner.description}
              priority={banner.id === 1}
              fill
              sizes="100vw"
              quality={90}
              className="object-cover object-center "
            />
          </div>
        </SwiperSlide>
      ))}
      {/* {slider?.map((banner: ISlider) => (
        <SwiperSlide key={banner?.code} className="">
          <div className="aspect-[16/11]  w-full md:aspect-[21/9] relative">
            <Image
              src={banner?.imageUrl}
              alt={banner?.description}
              priority={banner.order === 1}
              fill
              sizes="100vw"
              quality={90}
              className="object-cover object-center "
            />
          </div>
        </SwiperSlide>
      ))} */}
    </Swiper>
  );
}
