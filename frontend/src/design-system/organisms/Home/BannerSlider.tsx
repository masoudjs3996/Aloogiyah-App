"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Image from "next/image";

export default function BannerSlider() {
const BANNER_IMAGES = [
  {
    id: 1,
    src: "/images/banner/hero-1.jpg",
    description: "بنر تبلیغاتی برای محصول کشاورزی",
  },
  { id: 2, src: "/images/banner/hero-2.jpg", description: "بنر تبلیغاتی برای محصول کشاورزی",},
  {
    id: 3,
    src: "/images/banner/hero-3.jpg",
   description: "بنر تبلیغاتی برای محصول کشاورزی",
  },
];
  return (
   
      <Swiper
        modules={[Pagination,Autoplay]}
        className="rounded-xl overflow-hidden "
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
            <div className="aspect-[16/9]  w-full md:aspect-[21/9] relative">
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
      </Swiper>
  
  );
}
