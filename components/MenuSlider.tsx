"use client";

import Link from "next/link";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

export type MenuSliderCategory = {
  name: string;
  slug: string;
  imageUrl?: string;
  iconUrl?: string;
};

type MenuSliderProps = {
  categories: MenuSliderCategory[];
};

const MenuSlider = ({ categories }: MenuSliderProps) => {
  if (!categories?.length) return null;

  return (
    <div className="hidden border-t border-gray-100 lg:block">
      <Swiper
        modules={[Autoplay]}
        slidesPerView="auto"
        spaceBetween={14}
        autoplay={{
          delay: 0,
          disableOnInteraction: false,
        }}
        speed={3500}
        loop={categories.length > 6}
        className="w-full px-6"
      >
        {categories.map((item) => (
          <SwiperSlide
            key={item.slug}
            className="!w-fit py-3"
          >
            <Link
              href={`/category/${item.slug}`}
              className="whitespace-nowrap rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition-all duration-300 hover:border-black hover:bg-black hover:text-white"
            >
              {item.name}
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default MenuSlider;