"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";

export default function BannerSlider() {
  return (
    <div className="w-full">
      <Swiper
        pagination={{ clickable: true }}
        modules={[Pagination]}
        className="rounded-xl overflow-hidden shadow-lg"
        spaceBetween={10}
        slidesPerView={1}
      >
        {[...Array(9)].map((_, i) => (
          <SwiperSlide key={i}>
            <div className="flex items-center justify-center h-48 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xl font-bold">
              Slide {i + 1}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
